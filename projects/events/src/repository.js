import mongoose from 'mongoose';

const dynamicSchema = new mongoose.Schema({}, { strict: false });
const EventsModel = mongoose.model('Events', dynamicSchema);
await mongoose.connect('mongodb://localhost:27017/informacion-dominicana');

export class EventsRepository {
    async find(data) {
        return await EventsModel.find(data)
    }

    async create(data) {
        return await EventsModel.create(data)
    }
}
