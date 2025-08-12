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


app.post('/create-file', (req, res) => {
  const { folderPath, fileName, fileText } = req.body;

  if (!folderPath || !fileName || !fileText) {
    return res.status(400).json({
      error: 'folderPath, fileName, and fileText are required'
    });
  }

  fs.mkdirSync(folderPath, { recursive: true });

  const fullPath = path.join(folderPath, fileName);
  fs.writeFileSync(fullPath, fileText, 'utf8');

  const fileUrl = `http://localhost:${PORT}/${fullPath}`;
  res.json({ url: fileUrl });
});

app.use(express.static('.'));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
