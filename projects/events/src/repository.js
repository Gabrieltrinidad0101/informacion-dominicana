import mongoose from 'mongoose';

await mongoose.connect('mongodb://root:root@mongo:27017/informacion-dominicana?authSource=admin');

const models = {}
const dynamicSchema = new mongoose.Schema({}, { strict: false });

export class EventsRepository {

    async insertDefaultValues() {
        try {
            await PayrollExportToJson.updateOne(
                { _id: new mongoose.Types.ObjectId("688fa9e6c1e5bf7298db4b9b") },
                {
                    $set: {
                        institutionName: "Ayuntamiento de Jarabacoa"
                    }
                },
                { upsert: true }
            );

            await PayrollExportToJson.updateOne(
                { _id: new mongoose.Types.ObjectId("688fa9e6c1e5bf7298db4b9a") },
                {
                    $set: {
                        institutionName: "Ayuntamiento de Moca"
                    }
                },
                { upsert: true }
            );
        } catch {
            // manejar errores si quieres
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
