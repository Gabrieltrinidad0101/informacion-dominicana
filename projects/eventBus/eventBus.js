import amqplib from "amqplib"
import crypto from "crypto"
import { logs } from "./logs.js"
import dotenv from "dotenv"

const deterministicId = (...parts) =>
    crypto.createHash('sha256').update(parts.map(p => p ?? '').join('\x00')).digest('hex')

const DETERMINISTIC_KEYS = {
    downloads:              (e) => deterministicId(e.link, e.year, e.month, e.institutionName, e.typeOfData),
    extractedTexts:         (e) => deterministicId(e.imageUrl, e.traceId),
    extractedTextAnalyzers: (e) => deterministicId(e.extractedTextUrl, e.traceId),
    aiTextAnalyzers:        (e) => deterministicId(e.extractedTextAnalyzerUrl, e.traceId),
    fullAIProcess:          (e) => deterministicId(e.urlDownload, e.traceId),
}

dotenv.config({
    override: true
})

export class EventBus {
    complete = true
    static async init(retryCount = 0, prefetch = 100) {
        try {
            EventBus.connection = await amqplib.connect(`amqp://${process.env.RABBITMQ_USER ?? 'admin'}:${process.env.RABBITMQ_PASSWORD ?? 'admin'}@rabbitmq:5672`)
            EventBus.channel = await EventBus.connection.createChannel()
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
        const breaker = { failures: 0 }
        let consumerTag = null

        const startConsuming = async () => {
            const { consumerTag: tag } = await EventBus.channel.consume(queueName, async (message) => {
                if (!message) return
                const content = JSON.parse(message.content.toString())
                const headers = message.properties.headers ?? {}
                let success = false
                try {
                    const force = headers['force']
                    const typeOfExecute = headers['typeOfExecute']
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
                    breaker.failures = 0
                    success = true
                    logs.info(content)
                } catch (error) {
                    try {
                        const retryCount = (headers['x-retry-count'] || 0) + 1
                        const updatedContent = {
                            ...content,
                            _retryCount: retryCount,
                            _errors: [
                                ...(content._errors ?? []),
                                { message: error.message, date: new Date() }
                            ]
                        }
                        if (retryCount >= 3) {
                            breaker.failures++
                            console.error(JSON.stringify({
                                eventBusMaxInternalRetryError: error.message,
                                eventBusInternalLog: { traceId: content.traceId, _id: content._id, exchangeName: content.exchangeName, retryCount }
                            }))
                            EventBus.channel.nack(message, false, false)
                            if (breaker.failures >= 5) {
                                breaker.failures = 0
                                console.error(JSON.stringify({ circuitBreakerOpen: { queueName, resumeIn: 30000 } }))
                                await EventBus.channel.cancel(tag)
                                setTimeout(startConsuming, 30000)
                            }
                            return
                        }
                        await this.tryQueue(queueName, exchangeName)
                        EventBus.channel.publish(
                            `${exchangeName}_try`, '',
                            Buffer.from(JSON.stringify(updatedContent)),
                            { headers: { ...headers, 'x-retry-count': retryCount } }
                        )
                        EventBus.channel.ack(message)
                        logs.error(content, error)
                    } catch (parseError) {
                        console.error(JSON.stringify({
                            eventBusInternalRetryError: parseError.message,
                            eventBusInternalLog: { traceId: content.traceId, _id: content._id, exchangeName: content.exchangeName }
                        }))
                        EventBus.channel.nack(message, false, false)
                    }
                } finally {
                    if (!this.complete) return
                    EventBus.channel.publish(
                        "",
                        "completed_event",
                        Buffer.from(JSON.stringify({
                            traceId: content.traceId,
                            _id: content._id,
                            exchangeName: content.exchangeName,
                            ...(success ? { completedDate: new Date() } : { errorDate: new Date() })
                        }))
                    )
                }
            })
            consumerTag = tag
        }

        await startConsuming()
    }

    emit(exchangeName, data, metadata) {
        const metadataCopy = { ...metadata }
        if (!data.traceId) data.traceId = crypto.randomUUID()
        data.exchangeName = exchangeName
        if (!data._id) {
            const idFn = DETERMINISTIC_KEYS[exchangeName]
            if (idFn) data._id = idFn(data)
        }
        if (metadataCopy?.typeOfExecute === "onlyOne") return;
        if (metadataCopy?.typeOfExecute === "onlyOneAndNext") metadataCopy.typeOfExecute = "onlyOne"
        delete data.progressDate
        delete data.completedDate
        delete data.startDate
        delete data._retryCount
        delete data._errors
        EventBus.channel.publish(exchangeName, '', Buffer.from(JSON.stringify(data)), {
            headers: metadataCopy
        })
    }

    emitCustomExchange(exchangeName, event, metadata) {
        if (!event.traceId) event.traceId = crypto.randomUUID()
        event.exchangeName = exchangeName
        if (!event._id) {
            const idFn = DETERMINISTIC_KEYS[exchangeName]
            if (idFn) event._id = idFn(event)
        }
        EventBus.channel.publish(exchangeName, '', Buffer.from(JSON.stringify(event)), {
            headers: metadata
        })
    }
}

await EventBus.init()
export const eventBus = new EventBus()

const shutdown = async (signal) => {
    console.log(JSON.stringify({ gracefulShutdown: signal }))
    try {
        await EventBus.channel?.close()
        await EventBus.connection?.close()
    } catch (err) {
        console.error(JSON.stringify({ shutdownError: err.message }))
    }
    process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))