import mongoose from 'mongoose';

await mongoose.connect('mongodb://user:password@192.168.49.2:32017/informacion-dominicana?authSource=admin',{
      useNewUrlParser: true,
  useUnifiedTopology: true,
});

const models = {}
const dynamicSchema = new mongoose.Schema({}, { strict: false });

export class EventsRepository {
    async find(data) {
        console.log(data)
        const Model = models[data.exchangeName] ?? mongoose.model(data.exchangeName, dynamicSchema);
        return await Model.find({...data})
    }
    
    async save(data) {
        const Model = models[data.exchangeName] ?? mongoose.model(data.exchangeName, dynamicSchema);
        await Model.findByIdAndUpdate(
            data._id,
            data,
            {
                upsert: true,
                new: true,
            }
        );
    }
}
