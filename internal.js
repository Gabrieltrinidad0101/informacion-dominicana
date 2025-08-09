import mongoose from 'mongoose';

await mongoose.connect('mongodb://user:password@192.168.49.2:32017/informacion-dominicana?authSource=admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const dynamicSchema = new mongoose.Schema({}, { strict: false });
const Payroll = mongoose.models.payroll ?? mongoose.model("textanalysisais", dynamicSchema);

await Payroll.updateMany(
  { month: "junio" }, // filter
  { $set: { month: 6 } } // update
);