import amqplib from "amqplib"
import crypto from "crypto"
import { logs } from "./logs"

const connection = await amqplib.connect("amqp://admin:admin@rabbitmq:5672")
const channel = await connection.createChannel()
await channel.prefetch(4)

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
                const force = message.properties.headers['force']
                const typeOfExecute = message.properties.headers['typeOfExecute']
                await callback(content,{force,typeOfExecute})
                channel.ack(message)
                logs.info(content)
            } catch (error) {
                try {
                    const content = JSON.parse(message.content.toString())
                    content.retryCount = (content.retryCount || 0) + 1
                    content.errors ??= []
                    content.errors.push(error.message)
                    if (content.retryCount >= 3) {
                        console.error(JSON.stringify({
                            eventBusMaxInternalRetryError: error.message,
                            eventBusInternalLog: { traceId: content.traceId, _id: content._id, exchangeName: content.exchangeName }
                        }))
                        channel.ack(message)
                        return
                    }
                    await this.tryQueue(queueName, exchangeName)
                    channel.publish(`${exchangeName}_try`, '', Buffer.from(JSON.stringify(content)), {
                        headers: { "x-retry-count": content.retryCount }
                    })
                    logs.error(content)
                } catch (parseError) {
                    const content = JSON.parse(message.content.toString())
                    console.error(JSON.stringify({
                        eventBusInternalRetryError: error.message,
                        eventBusInternalLog: { traceId: content.traceId, _id: content._id, exchangeName: content.exchangeName }
                    }))
                }
                channel.ack(message)
            }
        })
    }

    emit(exchangeName, data,metadata) {
        if (!data.traceId) data.traceId = crypto.randomUUID()
        data.exchangeName = exchangeName
        if (metadata?.typeOfExecute === "onlyOne") return;
        if (metadata?.typeOfExecute === "onlyOneAndNext") metadata.typeOfExecute = "onlyOne"
        channel.publish(exchangeName, '', Buffer.from(JSON.stringify(data)),{
            headers: metadata
        })
    }

    emitCustomExchange(exchangeName, event,metadata) {
        if (!event.traceId) event.traceId = crypto.randomUUID()
        event.exchangeName = exchangeName
        channel.publish(exchangeName, '', Buffer.from(JSON.stringify(event)),{
            headers: metadata
        })
    }
}