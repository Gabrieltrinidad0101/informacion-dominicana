import express from 'express';
import { FileManagerClient } from "../fileManagerClient/main.js"
import cors from "cors";

const app = express();
const PORT = 4000;
app.use(express.json());
app.use(cors("*"));
const fileManagerClient = new FileManagerClient();

// Execute that fucntion for any url
app.get('/*splat', async (req, res) => {
  try {
    const fileKey = req.params.splat.join("/");
    const s3Response = await fileManagerClient.getFileStream(fileKey);
    res.setHeader(
      "Content-Type",
      s3Response.ContentType || "application/octet-stream"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileKey.split("/").pop()}"`
    );

    s3Response.Body.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error downloading file" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
