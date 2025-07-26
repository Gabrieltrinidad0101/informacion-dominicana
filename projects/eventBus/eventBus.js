import amqplib from "amqplib"

const connection = await amqplib.connect("amqp://localhost")
const channel = await connection.createChannel()

export class EventBus {
    constructor({ queueName, exchangeName }) {
        channel.assertQueue(queueName, { durable: true })
        channel.assertExchange(exchangeName, "fanout", { durable: true })
        channel.bindQueue(queue, exchangeName, "")
    }

    on(callback) {
        channel.consume(queue, (message) => {
            try {
                const content = JSON.parse(message.content.toString())
                callback(content)
            } catch {
                const retryCount = (message.properties.headers?.["x-retry-count"] || 0) + 1;
                if (retryCount >= 5) {
                    console.log("⚠️ Max retries reached, send to DLQ or log permanently.");
                    return;
                }
                channel.publish(exchangeNameTry, "", Buffer.from(message.content), {
                    headers: {
                        "x-retry-count": retryCount
                    }
                });
            } finally {
                channel.ack(message)
            }
        })

    }

    emit(event, ...args) {
        if (!this.events[event]) {
            return
        }
        this.events[event].forEach(callback => callback(...args))
    }
}