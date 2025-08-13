import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { folderPath } = req.body;

    if (!folderPath) {
      return cb(new Error('No folderPath provided'), null);
    }

    fs.mkdirSync(folderPath, { recursive: true });

    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({ response: 'ok' });
});

app.get('/file-exists', (req, res) => {
  const { filePath } = req.query;

  if (!filePath) {
    return res.status(400).json({ error: 'filePath query parameter is required' });
  }

  const fullPath = path.resolve(filePath);

  if (fs.existsSync(fullPath)) {
    return res.json({ exists: true });
  } else {
    return res.json({ exists: false });
  }
});

app.post('/upload-file-from-url', async (req, res) => {
  const { url, folderPath } = req.body;
  if (!url || !folderPath) {
    return res.status(400).json({ error: 'url and folderPath are required' });
  }
  const fileName = path.basename(url);
  const fullPath = path.join(folderPath, fileName);
  fs.writeFileSync(fullPath, fs.readFileSync(url));
  await new Promise((resolve,reject) => {
    const dl = new DownloaderHelper(url, folderPath);
    dl.on('end', resolve);
    dl.on('error', reject);
    dl.start().catch(reject);
  });
  res.json({ response: 'ok' });
})


app.post('/create-file', (req, res) => {
  const { folderPath, fileText } = req.body;

  if (!folderPath || !fileText) {
    return res.status(400).json({
      error: 'folderPath, and fileText are required'
    });
  }

  fs.mkdirSync(folderPath, { recursive: true });

  const fileName = path.basename(folderPath);
  const fullPath = path.join(folderPath, fileName);
  fs.writeFileSync(fullPath, fileText, 'utf8');

  const fileUrl = `http://localhost:${PORT}/${fullPath}`;
  res.json({ url: fileUrl });
});

app.use(express.static('.'));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
