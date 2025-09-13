import mongoose from 'mongoose';

await mongoose.connect('mongodb://root:root@mongo:27017/informacion-dominicana?authSource=admin');

const dynamicSchema = new mongoose.Schema({}, { strict: false });
const Payroll = mongoose.models.payroll ?? mongoose.model("payroll", dynamicSchema);

export class Repository {

    async save(data) {
        const bulkOps = data.map(doc => ({
            updateOne: {
                filter: { _id: doc._id }, 
                update: { $set: doc },
                upsert: true
            }
        }));

        await Payroll.bulkWrite(bulkOps, { ordered: false });
    }

    async delete({date, institutionName,index,traceId,urlDownload}) {
        await Payroll.deleteMany({date, institutionName,index,traceId,urlDownload});
    }
}
