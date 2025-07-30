import mongoose from 'mongoose';

await mongoose.connect('mongodb://user:password@192.168.49.2:32017/informacion-dominicana?authSource=admin',{
      useNewUrlParser: true,
  useUnifiedTopology: true,
});
const dynamicSchema = new mongoose.Schema({}, { strict: false });
const EventsModel = mongoose.model('Events', dynamicSchema);

export class EventsRepository {
    async find(data) {
        return await EventsModel.find({...data})
    }

    async save(data) {
        if(!data._id){
            return await EventsModel.create(data)
        }
        await EventsModel.findByIdAndUpdate(
            data._id,
            data,
            {
                upsert: true,
                new: true,
            }
        );
    }
}
