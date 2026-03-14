import amqplib from "amqplib"
import crypto from "crypto"
import { logs } from "./logs.js"
import dotenv from "dotenv"

dotenv.config({
    override: true
})

export class EventBus {
    complete = true
    static async init(retryCount = 0, prefetch = 100) {
        try {
            const connection = await amqplib.connect(`amqp://${process.env.RABBITMQ_USER ?? 'admin'}:${process.env.RABBITMQ_PASSWORD ?? 'admin'}@rabbitmq:5672`)
            EventBus.channel = await connection.createChannel()
            console.log("🚀 Connected to RabbitMQ...")
            await EventBus.channel.prefetch(prefetch)
        } catch (error) {
            console.log(error)
            if (retryCount <= 3) {
                await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 5000))
                await EventBus.init(retryCount + 1)
            } else {
                throw error
            }
        }
    }

    async prefetch(prefetch) {
        await EventBus.channel.prefetch(prefetch)
    }

    constructor({ queueName, exchangeName } = {}) {
        if (!queueName || !exchangeName) return;
        EventBus.channel.assertQueue(queueName, { durable: true })
        EventBus.channel.assertExchange(exchangeName, "fanout", { durable: true })
        EventBus.channel.bindQueue(queueName, exchangeName, "")
        this.queueName = queueName
        this.exchangeName = exchangeName

        EventBus.channel.assertQueue(`${queueName}_try`, {
            durable: true,
            arguments: {
                'x-message-ttl': 5000,
                'x-dead-letter-exchange': exchangeName
            }
        })
        EventBus.channel.assertExchange(`${exchangeName}_try`, "fanout", { durable: true })
        EventBus.channel.bindQueue(`${queueName}_try`, `${exchangeName}_try`, "")
    }


    async bindQueue(queueName, exchangeName) {
        await EventBus.channel.assertQueue(queueName, { durable: true })
        await EventBus.channel.assertExchange(exchangeName, "fanout", { durable: true })
        await EventBus.channel.bindQueue(queueName, exchangeName, "")
    }

    async tryQueue(queueName, exchangeName) {
        await EventBus.channel.assertQueue(`${queueName}_try`, {
            durable: true,
            arguments: {
                'x-message-ttl': 5000,
                'x-dead-letter-exchange': exchangeName
            }
        })
        await EventBus.channel.assertExchange(`${exchangeName}_try`, "fanout", { durable: true })
        await EventBus.channel.bindQueue(`${queueName}_try`, `${exchangeName}_try`, "")
    }

    set testMode(value) {
        logs.disabled = value
    }

    async on(queueName, exchangeName, callback) {
        await this.bindQueue(queueName, exchangeName)
        await EventBus.channel.consume(queueName, async (message) => {
            if (!message) return
            const content = JSON.parse(message.content.toString())
            let success = false
            try {
                const force = message.properties.headers['force']
                const typeOfExecute = message.properties.headers['typeOfExecute']
                if (this.complete) {
                    EventBus.channel.publish(
                        "",
                        "completed_event",
                        Buffer.from(JSON.stringify({
                            traceId: content.traceId,
                            _id: content._id,
                            exchangeName: content.exchangeName,
                            progressDate: new Date()
                        }))
                    )
                }
                await callback(content, { force, typeOfExecute })
                EventBus.channel.ack(message)
                success = true
                logs.info(content)
            } catch (error) {
                try {
                    content.retryCount = (content.retryCount || 0) + 1
                    content.errors ??= []
                    content.errors.push(error.message)
                    if (content.retryCount >= 3) {
                        console.error(JSON.stringify({
                            eventBusMaxInternalRetryError: error.message,
                            eventBusInternalLog: { traceId: content.traceId, _id: content._id, exchangeName: content.exchangeName }
                        }))
                        EventBus.channel.ack(message)
                        return
                    }
                    await this.tryQueue(queueName, exchangeName)
                    EventBus.channel.publish(`${exchangeName}_try`, '', Buffer.from(JSON.stringify(content)), {
                        headers: { "x-retry-count": content.retryCount }
                    })
                    logs.error(content, error)
                } catch (parseError) {
                    console.error(parseError)
                    const content = JSON.parse(message.content.toString())
                    console.error(JSON.stringify({
                        eventBusInternalRetryError: parseError.message,
                        eventBusInternalLog: { traceId: content.traceId, _id: content._id, exchangeName: content.exchangeName }
                    }))
                }
                EventBus.channel.ack(message)
            } finally {
                if (!this.complete || !success) return
                EventBus.channel.publish(
                    "",
                    "completed_event",
                    Buffer.from(JSON.stringify({
                        traceId: content.traceId,
                        _id: content._id,
                        exchangeName: content.exchangeName,
                        completedDate: new Date()
                    }))
                )
            }
        })
    }

    emit(exchangeName, data, metadata) {
        const metadataCopy = { ...metadata }
        if (!data.traceId) data.traceId = crypto.randomUUID()
        data.exchangeName = exchangeName
        if (metadataCopy?.typeOfExecute === "onlyOne") return;
        if (metadataCopy?.typeOfExecute === "onlyOneAndNext") metadataCopy.typeOfExecute = "onlyOne"
        delete data.errors
        delete data.retryCount
        delete data.progressDate
        delete data.completedDate
        delete data.startDate
        EventBus.channel.publish(exchangeName, '', Buffer.from(JSON.stringify(data)), {
            headers: metadataCopy
        })
    }

    emitCustomExchange(exchangeName, event, metadata) {
        if (!event.traceId) event.traceId = crypto.randomUUID()
        event.exchangeName = exchangeName
        EventBus.channel.publish(exchangeName, '', Buffer.from(JSON.stringify(event)), {
            headers: metadata
        })
    }
}

await EventBus.init()
export const eventBus = new EventBus()