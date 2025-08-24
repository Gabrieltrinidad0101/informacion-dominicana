import amqplib from "amqplib"
import crypto from "crypto"

const connection = await amqplib.connect("amqp://admin:admin@rabbitmq:5672")
const channel = await connection.createChannel()
await channel.prefetch(1)

export class EventBus {
    constructor({ queueName, exchangeName } = {}) {
        if (!queueName || !exchangeName) return
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


    async bindQueue(queueName, exchangeName) {
        await channel.assertQueue(queueName, { durable: true })
        await channel.assertExchange(exchangeName, "fanout", { durable: true })
        await channel.bindQueue(queueName, exchangeName, "")
    }

    async tryQueue(queueName, exchangeName) {
        await channel.assertQueue(`${queueName}_try`, {
            durable: true,
            arguments: {
                'x-message-ttl': 5000,
                'x-dead-letter-exchange': exchangeName
            }
        })
        await channel.assertExchange(`${exchangeName}_try`, "fanout", { durable: true })
        await channel.bindQueue(`${queueName}_try`, `${exchangeName}_try`, "")
    }

    async on(queueName, exchangeName, callback) {
        await this.bindQueue(queueName, exchangeName)
        await channel.consume(queueName, async (message) => {
            if (!message) return
            try {
                const content = JSON.parse(message.content.toString())
                console.log(`${exchangeName} - ${content?.aiTextAnalyzerUrl ?? content?.analyzeExtractedTextUrl ?? content?.imageUrl ?? content?.urlDownload ?? content?.link}`)

                await callback(content) // wait until done
                channel.ack(message)    // ack only after success
            } catch (error) {
                console.error("Consumer error:", error)

                // retry logic
                try {
                    const content = JSON.parse(message.content.toString())
                    content.retryCount = (content.retryCount || 0) + 1
                    if (content.retryCount >= 3) {
                        console.log("⚠️ Max retries reached, send to DLQ or log permanently.")
                        channel.ack(message) // we ack to avoid infinite redelivery
                        return
                    }
                    await this.tryQueue(queueName, exchangeName)
                    channel.publish(`${exchangeName}_try`, '', Buffer.from(JSON.stringify(content)), {
                        headers: { "x-retry-count": content.retryCount }
                    })
                } catch (parseError) {
                    console.error("Message parse error:", parseError)
                }

                channel.ack(message) // ack the original message to avoid redelivery
            }
        })


    }

    emit(exchangeName, data) {
        if (!data.traceId) data.traceId = crypto.randomUUID()
        data.exchangeName = exchangeName
        channel.publish(exchangeName, '', Buffer.from(JSON.stringify(data)))
    }

    emitCustomExchange(exchangeName, data) {
        if (!data.traceId) data.traceId = crypto.randomUUID()
        data.exchangeName = exchangeName
        channel.publish(exchangeName, '', Buffer.from(JSON.stringify(data)))
    }
}