import mongoose from 'mongoose';

await mongoose.connect('mongodb://root:root@mongo:27017/informacion-dominicana?authSource=admin');

const models = {}
const dynamicSchema = new mongoose.Schema({}, { strict: false });

export class EventsRepository {
    async find(data) {
        const Model = models[data.exchangeName] ?? mongoose.model(data.exchangeName, dynamicSchema);
        delete data.exchangeName
        return await Model.find({...data})
    }
    
    async save(data) {
        const Model = models[data.exchangeName] ?? mongoose.model(data.exchangeName, dynamicSchema);
        if(!data._id) data._id = new mongoose.Types.ObjectId()
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
        return await Model.deleteMany({...data})
    }
}
