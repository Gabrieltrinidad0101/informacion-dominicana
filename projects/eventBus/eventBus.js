import amqplib from "amqplib"

const connection = await amqplib.connect("amqp://user:password@192.168.49.2:31672/")
const channel = await connection.createChannel()

export class EventBus {
    constructor({ queueName, exchangeName }) {
        if(!queueName || !exchangeName) return
        channel.assertQueue(queueName, { durable: true })
        channel.assertExchange(exchangeName, "fanout", { durable: true })
        channel.bindQueue(queueName, exchangeName, "")
        this.queueName = queueName
        this.exchangeName = exchangeName

        //retry
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

    bindQueue(queueName, exchangeName, routingKey) {
        channel.assertQueue(queueName, { durable: true })
        channel.bindQueue(queueName, exchangeName, routingKey)
    }

    on(queueName, callback) {
        channel.consume(queueName, async (message) => {
            try {
                const content = JSON.parse(message.content.toString())
                await callback(content)
            } catch (error) {
                console.log(error)
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
        channel.publish(this.exchangeName, '', Buffer.from(JSON.stringify(data)))
    }

    emitCustomExchange(exchangeName,data) {
        channel.publish(exchangeName, '', Buffer.from(JSON.stringify(data)))
    }
}