import mongoose from 'mongoose';
import fs from 'fs/promises'

console.log({
    MONGO_DB_USER: process.env.MONGO_DB_USER,
    MONGO_DB_PASSWORD: process.env.MONGO_DB_PASSWORD
})

await mongoose.connect(`mongodb://${process.env.MONGO_DB_USER ?? 'root'}:${process.env.MONGO_DB_PASSWORD ?? 'root'}@mongo:27017/informacion-dominicana?authSource=admin`);
console.log("🚀 Connected to MongoDB...") 
 
const models = {}
const dynamicSchema = new mongoose.Schema({}, { strict: false });


export class EventsRepository { 
    static async init(retryCount = 0) {
        try {
            await mongoose.connect(`mongodb://${process.env.MONGO_DB_USER ?? 'root'}:${process.env.MONGO_DB_PASSWORD ?? 'root'}@mongo:27017/informacion-dominicana?authSource=admin`);
            console.log("🚀 Connected to MongoDB...")
        } catch (error) {
            console.log(error)
            if (retryCount < 3) {
                await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000))
                EventsRepository.init(retryCount + 1)
            } else {
                throw error
            }
        }
    }
    async insertDefaultValues() {
        try {
            const data = JSON.parse(await fs.readFile('./projects/events/src/defaultEvents.json'))
            for (const [key,values] of Object.entries(data)) {
                const Model = mongoose.model(key, dynamicSchema);
                for (const value of values) {
                    await Model.updateOne(
                        { _id: new mongoose.Types.ObjectId(value._id) },
                        {
                            $set: {
                                ...value
                            }
                        },
                        { upsert: true }
                    );
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    dataToQuery = (data) => {
        const query = {};
        for (const key in data) {
            if (key === '_id') {
                query[key] = data[key]
            } else if (key == 'index') {
                query[key] = parseInt(data[key]);
            } else if (data[key] !== undefined && data[key] !== null) {
                query[key] = { $regex: data[key].toString(), $options: "i" };
            }
        }
        return query
    }

    async find(data_) {
        const data = { ...data_ }
        const Model = models[data.exchangeName] ?? mongoose.model(data.exchangeName, dynamicSchema);
        delete data.exchangeName
        const query = this.dataToQuery(data)
        return await Model.find({ ...query })
    }

    async findOne(data_) {
        const data = { ...data_ }
        const Model = models[data.exchangeName] ?? mongoose.model(data.exchangeName, dynamicSchema);
        delete data.exchangeName
        return await Model.findOne({ ...data })
    }

    async save(data) {
        const Model = models[data.exchangeName] ?? mongoose.model(data.exchangeName, dynamicSchema);
        if (!data._id) data._id = new mongoose.Types.ObjectId()
        await Model.findByIdAndUpdate(
            data._id,
            data,
            {
                upsert: true,
                new: true,
            }
        );
    }

    async deleteEvents(data) {
        const Model = models[data.exchangeName] ?? mongoose.model(data.exchangeName, dynamicSchema);
        delete data.exchangeName
        const query = this.dataToQuery(data)
        return await Model.deleteMany({ ...query })
    }
}
