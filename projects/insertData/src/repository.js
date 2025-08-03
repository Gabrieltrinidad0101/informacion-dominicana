import mongoose from 'mongoose';

await mongoose.connect('mongodb://user:password@192.168.49.2:32017/informacion-dominicana?authSource=admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const dynamicSchema = new mongoose.Schema({}, { strict: false });
const Payroll = mongoose.models.payroll ?? mongoose.model("payroll", dynamicSchema);

export class Repository {

    async save(data) {
        await Payroll.insertMany(data, { ordered: false });
    }

}
