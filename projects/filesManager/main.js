import express from 'express';
import multer from 'multer';
import path, { dirname } from "path"
import fs from 'fs';
import { DownloaderHelper } from 'node-downloader-helper';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 4000;

const __dirname = dirname(fileURLToPath(import.meta.url));
const generetedPath = (folderPath) => path.join(__dirname, '../../data', path.dirname(folderPath))
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../data")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { folderPath } = req.body;

    if (!folderPath) {
      return cb(new Error('No folderPath provided'), null);
    }

    fs.mkdirSync(generetedPath(folderPath), { recursive: true });

    cb(null, generetedPath(folderPath));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
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

  const fullPath = generetedPath(filePath);
  const fileName = path.basename(filePath);

  if (fs.existsSync(path.join(fullPath, fileName))) {
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

  if (fs.existsSync(generetedPath(folderPath))) {
    return res.json({ response: 'ok' });
  }
  
  await new Promise((resolve, reject) => {
    fs.mkdirSync(generetedPath(folderPath), { recursive: true })
    const dl = new DownloaderHelper(url, generetedPath(folderPath));
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
