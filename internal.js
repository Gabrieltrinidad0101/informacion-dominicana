import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

await mongoose.connect('mongodb://root:root@localhost:27017/informacion-dominicana?authSource=admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const FOLDER_PATH = '/home/gabriel-trinidad/Downloads/mongo'; // change 'data' to your folder

async function importFiles() {
  try {
    const files = fs.readdirSync(FOLDER_PATH);

    for (const file of files) {
      const ext = path.extname(file);
      if (ext !== '.json') continue; // skip non-JSON files

      const collectionName = path.basename(file, ext).replace('informacion-dominicana.',''); // collection = file name without extension
      const filePath = path.join(FOLDER_PATH, file);

      const rawData = fs.readFileSync(filePath, 'utf8');
      let data = JSON.parse(rawData);

      data = data.map(doc => {
        if (doc._id && typeof doc._id === 'object' && doc._id.$oid) {
          doc._id = doc._id.$oid;
        }
        return doc;
      });

      // Use Mongoose dynamic model
      const DynamicModel = mongoose.model(
        collectionName,
        new mongoose.Schema({}, { strict: false }),
        collectionName
      );

      await DynamicModel.insertMany(data);
      console.log(`Inserted ${data.length} documents into collection "${collectionName}"`);
    }

    console.log('All files imported successfully!');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error importing files:', error);
    mongoose.disconnect();
  }
}

importFiles();