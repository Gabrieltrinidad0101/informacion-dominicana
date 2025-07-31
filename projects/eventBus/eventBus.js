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

    async on(queueName,exchangeName, callback) {
        await this.bindQueue(queueName, exchangeName)
        await channel.consume(queueName, async (message) => {
            try {
                const content = JSON.parse(message.content.toString())
                await callback(content)
            } catch (error) {
                console.log(error)
                return 
                const content = JSON.parse(message.content.toString())
                content.retryCount = (content.retryCount || 0) + 1;
                if (content.retryCount >= 3) {
                    console.log("⚠️ Max retries reached, send to DLQ or log permanently.");
                    return;
                }
                await this.tryQueue(queueName,exchangeName)
                channel.publish(`${exchangeName}_try`,'', Buffer.from(content), {
                    headers: {
                        "x-retry-count": retryCount
                    }
                });
            } finally {
                channel.ack(message)
            }
        })

    }

    emit(exchangeName, data) {
        if (!data.traceId) data.traceId = crypto.randomUUID()
        if (data.retryCount === 0 || !data.retryCount ) delete data._id 
        data.exchangeName = exchangeName
        channel.publish(exchangeName, '', Buffer.from(JSON.stringify(data)))
    }

    emitCustomExchange(exchangeName,data) {
        if (!data.traceId) data.traceId = crypto.randomUUID()
        data.exchangeName = exchangeName
        channel.publish(exchangeName, '', Buffer.from(JSON.stringify(data)))
    }
}