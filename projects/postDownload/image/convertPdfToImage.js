import { fromPath } from "pdf2pic";
import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";
import path from "path";

const options = (saveFilename, savePath) => ({
  density: 700,
  savePath,
  saveFilename,
  format: "jpg",
  width: 2000,
  height: 2000,
});

export class PdfToImage {
  constructor(eventBus, fileManagerClient) {
    this.eventBus = eventBus;
    this.fileManagerClient = fileManagerClient;

    this.eventBus.on("postDownload", "postDownloads", async (data) => {
      await this.getTextFromImage(data);
    });
  }

  #getNumbersOfPages = async (pdfPath) => {
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(dataBuffer);
    return pdfData.numpages;
  };

  getTextFromImage = async (data) => {
    if (!data.urlDownload.includes("pdf")) return;

    // Directory where images will be saved
    const saveImages = this.fileManagerClient.generateUrl(
      data,
      "postDownloads",
      ""
    );

    fs.mkdirSync(saveImages, { recursive: true });
    await this.fileManagerClient.downloadFile(data.urlDownload);
    const pdfPath = path.resolve(`downloads/${data.urlDownload}`);
    const numberOfPages = await this.#getNumbersOfPages(pdfPath);
    const convert = fromPath(pdfPath, options("_", saveImages));

    delete data._id;

    await new Promise((resolve) => setTimeout(resolve, 1000 * Math.floor(Math.random() * 10)));


    for (let i = 1; i <= numberOfPages; i++) {
      const fileName = `_.${i}.jpg`;
      const imagePath = path.resolve(saveImages, fileName);
      const imageUrl = this.fileManagerClient.generateUrl(
        data,
        "postDownloads",
        fileName
      );
      
      if (!(await this.fileManagerClient.fileExists(imageUrl))) {
        await convert(i); 
        await this.fileManagerClient.uploadFile(imagePath, imageUrl);
      }

      
      this.eventBus.emit("extractedTexts", {
        ...data,
        index: i,
        imageUrl,
      });
    }
    
    // Clean up folder AFTER all pages processed
    fs.rmdirSync(saveImages, { recursive: true });
  };
}
