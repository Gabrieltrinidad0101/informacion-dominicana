import mongoose from 'mongoose';

await mongoose.connect('mongodb://user:password@192.168.49.2:32017/informacion-dominicana?authSource=admin',{
      useNewUrlParser: true,
  useUnifiedTopology: true,
});
const dynamicSchema = new mongoose.Schema({}, { strict: false });
const EventsModel = mongoose.model('Events', dynamicSchema);

export class EventsRepository {
    async find(data) {
        return await EventsModel.find(data)
    }

    async create(data) {
        return await EventsModel.create(data)
    }
}
