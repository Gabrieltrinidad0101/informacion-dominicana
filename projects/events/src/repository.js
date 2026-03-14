import mongoose from 'mongoose';
import fs from 'fs/promises'

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
                await EventsRepository.init(retryCount + 1)
            } else {
                throw error
            }
        }
    }
    async insertDefaultValues() {
        try {
            const data = JSON.parse(await fs.readFile('./projects/events/src/defaultEvents.json'))
            for (const [key, values] of Object.entries(data)) {
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

    escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    dataToQuery = (data) => {
        const query = {};
        for (const key in data) {
            if (key === '_id') {
                query[key] = data[key]
            } else if (key == 'index') {
                query[key] = parseInt(data[key]);
            } else if (data[key] !== undefined && data[key] !== null) {
                query[key] = { $regex: this.escapeRegex(data[key].toString()), $options: "i" };
            }
        }
        return query
    }

    filtersToQuery = (filters) => {
        const query = {}
        for (const f of filters) {
            if (f.operator === 'contains') query[f.key] = { $regex: this.escapeRegex(f.value), $options: 'i' }
            else if (f.operator === 'equals') query[f.key] = f.value
            else if (f.operator === 'notEquals') query[f.key] = { $ne: f.value }
            else if (f.operator === 'exists') query[f.key] = { $exists: true }
            else if (f.operator === 'notExists') query[f.key] = { $exists: false }
            else if (f.operator === 'dateRange') {
                query[f.key] = {}
                if (f.from) query[f.key].$gte = new Date(f.from)
                if (f.to) query[f.key].$lte = new Date(f.to + 'T23:59:59.999Z')
            }
        }
        return query
    }

    async find(data_) {
        const data = { ...data_ }
        const Model = models[data.exchangeName] ?? mongoose.model(data.exchangeName, dynamicSchema);
        delete data.exchangeName;

        const { page, limit, filters: filtersJson } = data;
        const filters = filtersJson ? JSON.parse(filtersJson) : null

        if (page !== undefined && limit !== undefined) {
            delete data.page;
            delete data.limit;
            delete data.filters;

            const query = filters ? this.filtersToQuery(filters) : this.dataToQuery(data);
            const skip = parseInt(page) * parseInt(limit);

            const [result, count] = await Promise.all([
                Model.find({ ...query }).skip(skip).limit(parseInt(limit)),
                Model.countDocuments({ ...query })
            ]);

            return {
                data: result,
                total: count
            }
        }

        delete data.filters;
        const query = filters ? this.filtersToQuery(filters) : this.dataToQuery(data)
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
        const { _id, ...fields } = data
        await Model.findByIdAndUpdate(
            _id,
            { $set: fields },
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

    async getStats(exchangeName) {
        const Model = models[exchangeName] ?? mongoose.model(exchangeName, dynamicSchema);
        const [pending, inProgress, completed, withErrors] = await Promise.all([
            Model.countDocuments({ startDate: { $exists: true }, progressDate: { $exists: false }, completedDate: { $exists: false } }),
            Model.countDocuments({ progressDate: { $exists: true }, completedDate: { $exists: false } }),
            Model.countDocuments({ completedDate: { $exists: true }, errors: { $exists: false } }),
            Model.countDocuments({ errors: { $exists: true } }),
        ]);
        return { pending, inProgress, completed, withErrors };
    }

    async saveProgress(data) {
        const Model = models[data.exchangeName] ?? mongoose.model(data.exchangeName, dynamicSchema);
        const update = {}
        if (data.progressDate) update.progressDate = data.progressDate
        if (data.completedDate) update.completedDate = data.completedDate
        if (!Object.keys(update).length) return
        console.log({ update })
        await Model.findByIdAndUpdate(data._id, { $set: update })
    }

    async updateEvent(data) {
        const Model = models[data.exchangeName] ?? mongoose.model(data.exchangeName, dynamicSchema);
        delete data.exchangeName
        const query = this.dataToQuery(data)
        return await Model.updateMany({ ...query }, {
            $unset: { progressDate: "", completedDate: "", startDate: new Date() }
        })
    }


}
