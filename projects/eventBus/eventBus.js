import amqplib from "amqplib"
import crypto from "crypto"

const connection = await amqplib.connect("amqp://user:password@192.168.49.2:32672/")
const channel = await connection.createChannel()

export class EventBus {
    constructor({ queueName, exchangeName } = {}) {
        if(!queueName || !exchangeName) return
        channel.assertQueue(queueName, { durable: true })
        channel.assertExchange(exchangeName, "fanout", { durable: true })
        channel.bindQueue(queueName, exchangeName, "")
        this.queueName = queueName
        this.exchangeName = exchangeName

        channel.assertQueue(`${queueName}_try`, {
            durable: true,
            arguments: {
                'x-message-ttl': 5000,
                'x-dead-letter-exchange': exchangeName
            }
        })
        channel.assertExchange(`${exchangeName}_try`, "fanout", { durable: true })
        channel.bindQueue(`${queueName}_try`, `${exchangeName}_try`, "")
    }

    bindQueue(queueName, exchangeName) {
        channel.assertQueue(queueName, { durable: true })
        channel.assertExchange(exchangeName, "fanout", { durable: true })
        channel.bindQueue(queueName, exchangeName, "")
    }

    on(queueName, callback) {
        channel.assertQueue(queueName, { durable: true })
        channel.consume(queueName, async (message) => {
            try {
                const content = JSON.parse(message.content.toString())
                await callback(content)
            } catch (error) {
                const retryCount = (message.properties.headers?.["x-retry-count"] || 0) + 1;
                if (retryCount >= 5) {
                    console.log("⚠️ Max retries reached, send to DLQ or log permanently.");
                    return;
                }
                channel.publish(`${queueName}s_try`,'', Buffer.from(message.content), {
                    headers: {
                        "x-retry-count": retryCount
                    }
                });
            } finally {
                channel.ack(message)
            }
        })

    }

    emit(data) {
        if (!data.traceId) data.traceId = crypto.randomUUID()
        delete data._id
        data.exchange = this.exchangeName
        channel.publish(this.exchangeName, '', Buffer.from(JSON.stringify(data)))
    }

    emitCustomExchange(exchangeName,data) {
        if (!data.traceId) data.traceId = crypto.randomUUID()
        data.exchange = exchangeName
        channel.publish(exchangeName, '', Buffer.from(JSON.stringify(data)))
    }
}