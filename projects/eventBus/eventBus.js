import amqplib from "amqplib"
import crypto from "crypto"
import { logs } from "./logs.js"
import dotenv from "dotenv"

dotenv.config({
    override: true
})

export class EventBus {
    static async init(retryCount = 0) {
        try{
            console.log(`amqp://${process.env.RABBITMQ_USER ?? 'admin'}:${process.env.RABBITMQ_PASSWORD ?? 'admin'}@rabbitmq:5672`)
            const connection = await amqplib.connect(`amqp://${process.env.RABBITMQ_USER ?? 'admin'}:${process.env.RABBITMQ_PASSWORD ?? 'admin'}@rabbitmq:5672`)
            EventBus.channel = await connection.createChannel()
            console.log("🚀 Connected to RabbitMQ...")
            await EventBus.channel.prefetch(4)
        }catch(error){
            console.log(error)
            if(retryCount < 3){
                await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000))
                EventBus.init(retryCount + 1)
            }else{
                throw error
            }
        }
    }

    constructor({ queueName, exchangeName } = {}) {
        if (!queueName || !exchangeName) return
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

    async on(queueName, exchangeName, callback) {
        await this.bindQueue(queueName, exchangeName)
        await EventBus.channel.consume(queueName, async (message) => {
            if (!message) return
            try {
                const content = JSON.parse(message.content.toString())
                const force = message.properties.headers['force']
                const typeOfExecute = message.properties.headers['typeOfExecute']
                await callback(content,{force,typeOfExecute})
                EventBus.channel.ack(message)
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
                        EventBus.channel.ack(message)
                        return
                    }
                    await this.tryQueue(queueName, exchangeName)
                    EventBus.channel.publish(`${exchangeName}_try`, '', Buffer.from(JSON.stringify(content)), {
                        headers: { "x-retry-count": content.retryCount }
                    })
                    logs.error(content,error)
                } catch (parseError) {
                    console.error(parseError)
                    const content = JSON.parse(message.content.toString())
                    console.error(JSON.stringify({
                        eventBusInternalRetryError: parseError.message,
                        eventBusInternalLog: { traceId: content.traceId, _id: content._id, exchangeName: content.exchangeName }
                    }))
                }
                EventBus.channel.ack(message)
            }
        })
    }

    emit(exchangeName, data,metadata) {
        const metadataCopy = {...metadata}
        if (!data.traceId) data.traceId = crypto.randomUUID()
        data.exchangeName = exchangeName
        if (metadataCopy?.typeOfExecute === "onlyOne") return;
        if (metadataCopy?.typeOfExecute === "onlyOneAndNext") metadataCopy.typeOfExecute = "onlyOne"
        EventBus.channel.publish(exchangeName, '', Buffer.from(JSON.stringify(data)),{
            headers: metadataCopy
        })
    }

    emitCustomExchange(exchangeName, event,metadata) {
        if (!event.traceId) event.traceId = crypto.randomUUID()
        event.exchangeName = exchangeName
        EventBus.channel.publish(exchangeName, '', Buffer.from(JSON.stringify(event)),{
            headers: metadata
        })
    }
}

await EventBus.init()
export const eventBus = new EventBus()