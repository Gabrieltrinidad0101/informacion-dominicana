import express from 'express';
import { FileManagerClient } from "../fileManagerClient/main.js"

const app = express();
const PORT = 4000;
app.use(express.json());
const fileManagerClient = new FileManagerClient();

app.get("/:key", async (req, res) => {
  try {
    const fileKey = req.params.key;
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
