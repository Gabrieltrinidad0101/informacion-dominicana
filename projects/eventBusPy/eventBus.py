import pika
import json
import uuid
import logging
import os

logging.basicConfig(level=logging.INFO)

class EventBus:
    def __init__(self, queue_name=None, exchange_name=None, host='rabbitmq', user='admin', password='admin', prefetch_count=4):
        credentials = pika.PlainCredentials(os.getenv("RABBITMQ_USER",user),os.getenv("RABBITMQ_PASSWORD",password))
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=host, credentials=credentials,socket_timeout=20)
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

    def on(self, queue_name, exchange_name, callback):
        self.bind_queue(queue_name, exchange_name)

        def _consume_callback(ch, method, properties, body):
            try:
                message = json.loads(body)
                headers = properties.headers or {}
                force = headers.get('force')
                type_of_execute = headers.get('typeOfExecute')
                callback(message, {'force': force, 'typeOfExecute': type_of_execute})
                ch.basic_ack(delivery_tag=method.delivery_tag)
                logs.info(message)
            except Exception as e:
                print(e)
                try:
                    message = json.loads(body)
                    message['retryCount'] = message.get('retryCount', 0) + 1
                    message.setdefault('errors', []).append(str(e))
                    if message['retryCount'] >= 3:
                        logging.error(json.dumps({
                            "eventBusMaxInternalRetryError": str(e),
                            "eventBusInternalLog": {
                                "traceId": message.get('traceId'),
                                "_id": message.get('_id'),
                                "exchangeName": message.get('exchangeName')
                            }
                        }))
                        ch.basic_ack(delivery_tag=method.delivery_tag)
                        return
                    self.try_queue(queue_name, exchange_name)
                    try_exchange = f"{exchange_name}_try"
                    ch.basic_publish(
                        exchange=try_exchange,
                        routing_key='',
                        body=json.dumps(message),
                        properties=pika.BasicProperties(headers={"x-retry-count": message['retryCount']})
                    )
                    logs.error(message,str(e))
                except Exception as parse_error:
                    logging.error(parse_error)
                    logging.error(json.dumps({
                        "eventBusInternalRetryError": str(parse_error),
                        "eventBusInternalLog": {
                            "traceId": message.get('traceId'),
                            "_id": message.get('_id'),
                            "exchangeName": message.get('exchangeName')
                        }
                    }))
                ch.basic_ack(delivery_tag=method.delivery_tag)

        self.channel.basic_consume(queue=queue_name, on_message_callback=_consume_callback)
        self.channel.start_consuming()

    def emit(self, exchange_name, dataOriginal, metadataOriginal=None):
        data = {**dataOriginal}
        if 'traceId' not in data:
            data['traceId'] = str(uuid.uuid4())
        data['exchangeName'] = exchange_name
        metadata = {**metadataOriginal}
        if metadata:
            if metadata.get('typeOfExecute') == 'onlyOne':
                return
            if metadata.get('typeOfExecute') == 'onlyOneAndNext':
                metadata['typeOfExecute'] = 'onlyOne'
        self.channel.basic_publish(
            exchange=exchange_name,
            routing_key='',
            body=json.dumps(data),
            properties=pika.BasicProperties(headers=metadata)
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

    def error(self, data,error):
        print(json.dumps({
            "eventBusInternalError": error,
            "eventBusInternalLog": {
                "traceId": data.get('traceId'),
                "_id": data.get('_id'),
                "exchangeName": data.get('exchangeName')
            }
        }))


logs = Logs()
