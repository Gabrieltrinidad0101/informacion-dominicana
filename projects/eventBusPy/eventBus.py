import pika
import json
import uuid
import hashlib
import logging
import os
import copy
import signal
from datetime import datetime, timezone

def _deterministic_id(*parts):
    key = '\x00'.join(str(p) if p is not None else '' for p in parts)
    return hashlib.sha256(key.encode()).hexdigest()

DETERMINISTIC_KEYS = {
    'downloads':              lambda e: _deterministic_id(e.get('link'), e.get('year'), e.get('month'), e.get('institutionName'), e.get('typeOfData')),
    'extractedTexts':         lambda e: _deterministic_id(e.get('imageUrl'), e.get('traceId')),
    'extractedTextAnalyzers': lambda e: _deterministic_id(e.get('extractedTextUrl'), e.get('traceId')),
    'aiTextAnalyzers':        lambda e: _deterministic_id(e.get('extractedTextAnalyzerUrl'), e.get('traceId')),
}

logging.basicConfig(level=logging.INFO)

class EventBus:
    complete = True

    def __init__(self, queue_name=None, exchange_name=None, host='rabbitmq', user='admin', password='admin', prefetch_count=4):
        credentials = pika.PlainCredentials(os.getenv("RABBITMQ_USER", user), os.getenv("RABBITMQ_PASSWORD", password))
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=host, credentials=credentials, socket_timeout=20)
        )
        self.channel = self.connection.channel()
        self.channel.basic_qos(prefetch_count=prefetch_count)

        self.queue_name = queue_name
        self.exchange_name = exchange_name

        if queue_name and exchange_name:
            self._setup_queue(queue_name, exchange_name)
            self._setup_try_queue(queue_name, exchange_name)

    def _setup_queue(self, queue_name, exchange_name):
        self.channel.queue_declare(queue=queue_name, durable=True)
        self.channel.exchange_declare(exchange=exchange_name, exchange_type='fanout', durable=True)
        self.channel.queue_bind(queue=queue_name, exchange=exchange_name)

    def _setup_try_queue(self, queue_name, exchange_name):
        try_queue = f"{queue_name}_try"
        try_exchange = f"{exchange_name}_try"
        self.channel.queue_declare(
            queue=try_queue,
            durable=True,
            arguments={
                'x-message-ttl': 5000,
                'x-dead-letter-exchange': exchange_name
            }
        )
        self.channel.exchange_declare(exchange=try_exchange, exchange_type='fanout', durable=True)
        self.channel.queue_bind(queue=try_queue, exchange=try_exchange)

    def bind_queue(self, queue_name, exchange_name):
        self._setup_queue(queue_name, exchange_name)

    def try_queue(self, queue_name, exchange_name):
        self._setup_try_queue(queue_name, exchange_name)

    def prefetch(self, prefetch_count):
        self.channel.basic_qos(prefetch_count=prefetch_count)

    def _publish_completed_event(self, payload):
        self.channel.basic_publish(
            exchange='',
            routing_key='completed_event',
            body=json.dumps(payload)
        )

    def on(self, queue_name, exchange_name, callback):
        self.bind_queue(queue_name, exchange_name)

        def _consume_callback(ch, method, properties, body):
            message = json.loads(body)
            headers = properties.headers or {}
            success = False
            try:
                force = headers.get('force', False)
                type_of_execute = headers.get('typeOfExecute', None)

                if self.complete:
                    self._publish_completed_event({
                        'traceId': message.get('traceId'),
                        '_id': message.get('_id'),
                        'exchangeName': message.get('exchangeName'),
                        'progressDate': datetime.now(timezone.utc).isoformat()
                    })

                callback(copy.deepcopy(message), {'force': force, 'typeOfExecute': type_of_execute})
                ch.basic_ack(delivery_tag=method.delivery_tag)
                success = True
                logs.info(message)
            except Exception as e:
                try:
                    retry_count = (headers.get('x-retry-count') or 0) + 1
                    updated_message = {
                        **message,
                        '_retryCount': retry_count,
                        '_errors': [
                            *(message.get('_errors') or []),
                            { 'message': str(e), 'date': datetime.now(timezone.utc).isoformat() }
                        ]
                    }
                    if retry_count >= 3:
                        logging.error(json.dumps({
                            "eventBusMaxInternalRetryError": str(e),
                            "eventBusInternalLog": {
                                "traceId": message.get('traceId'),
                                "_id": message.get('_id'),
                                "exchangeName": message.get('exchangeName'),
                                "retryCount": retry_count
                            }
                        }))
                        ch.basic_nack(delivery_tag=method.delivery_tag, multiple=False, requeue=False)
                        return
                    self.try_queue(queue_name, exchange_name)
                    try_exchange = f"{exchange_name}_try"
                    ch.basic_publish(
                        exchange=try_exchange,
                        routing_key='',
                        body=json.dumps(updated_message),
                        properties=pika.BasicProperties(headers={**headers, 'x-retry-count': retry_count})
                    )
                    ch.basic_ack(delivery_tag=method.delivery_tag)
                    logs.error(message, str(e))
                except Exception as parse_error:
                    logging.error(json.dumps({
                        "eventBusInternalRetryError": str(parse_error),
                        "eventBusInternalLog": {
                            "traceId": message.get('traceId'),
                            "_id": message.get('_id'),
                            "exchangeName": message.get('exchangeName')
                        }
                    }))
                    ch.basic_nack(delivery_tag=method.delivery_tag, multiple=False, requeue=False)
            finally:
                if not self.complete:
                    return
                self._publish_completed_event({
                    'traceId': message.get('traceId'),
                    '_id': message.get('_id'),
                    'exchangeName': message.get('exchangeName'),
                    **({'completedDate': datetime.now(timezone.utc).isoformat()} if success else {'errorDate': datetime.now(timezone.utc).isoformat()})
                })

        def _shutdown(sig, frame):
            logging.info(json.dumps({"gracefulShutdown": signal.Signals(sig).name}))
            self.channel.stop_consuming()
            self.connection.close()

        signal.signal(signal.SIGTERM, _shutdown)
        signal.signal(signal.SIGINT, _shutdown)

        self.channel.basic_consume(queue=queue_name, on_message_callback=_consume_callback)
        self.channel.start_consuming()

    def emit(self, exchange_name, dataOriginal, metadataOriginal=None):
        data = {**dataOriginal}
        metadata = {**(metadataOriginal or {})}
        if 'traceId' not in data:
            data['traceId'] = str(uuid.uuid4())
        data['exchangeName'] = exchange_name
        if not data.get('_id'):
            id_fn = DETERMINISTIC_KEYS.get(exchange_name)
            if id_fn: data['_id'] = id_fn(data)
        if metadata.get('typeOfExecute') == 'onlyOne':
            return
        if metadata.get('typeOfExecute') == 'onlyOneAndNext':
            metadata['typeOfExecute'] = 'onlyOne'
        data.pop("_errors", None)
        data.pop("_retryCount", None)
        data.pop("progressDate", None)
        data.pop("completedDate", None)
        data.pop("startDate", None)
        self.channel.basic_publish(
            exchange=exchange_name,
            routing_key='',
            body=json.dumps(data),
            properties=pika.BasicProperties(headers=metadata)
        )

    def emit_custom_exchange(self, exchange_name, event, metadata=None):
        if 'traceId' not in event:
            event['traceId'] = str(uuid.uuid4())
        event['exchangeName'] = exchange_name
        if not event.get('_id'):
            id_fn = DETERMINISTIC_KEYS.get(exchange_name)
            if id_fn: event['_id'] = id_fn(event)
        self.channel.basic_publish(
            exchange=exchange_name,
            routing_key='',
            body=json.dumps(event),
            properties=pika.BasicProperties(headers=metadata or {})
        )


class Logs:
    def info(self, data):
        print(json.dumps({
            "eventBusInternalLog": {
                "traceId": data.get('traceId'),
                "_id": data.get('_id'),
                "exchangeName": data.get('exchangeName')
            }
        }))

    def error(self, data, error):
        print(json.dumps({
            "eventBusInternalError": error,
            "eventBusInternalLog": {
                "traceId": data.get('traceId'),
                "_id": data.get('_id'),
                "exchangeName": data.get('exchangeName')
            }
        }))


logs = Logs()
