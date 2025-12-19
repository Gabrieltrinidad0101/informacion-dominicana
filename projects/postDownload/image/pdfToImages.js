import { fromPath } from "pdf2pic";
import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";
import path from "path";
import { logs } from "../../eventBus/logs.js"

const options = (saveFilename, savePath) => ({
  density: 700,
  savePath,
  saveFilename,
  format: "jpg",
  width: 2000,
  height: 2000,
});

export class PdfToImages {
  constructor(fileManagerClient, eventBus) {
    this.eventBus = eventBus;
    this.fileManagerClient = fileManagerClient;
  }

  #getNumbersOfPages = async (pdfPath) => {
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(dataBuffer);
    return pdfData.numpages;
  };

  convertPdfToImages = async (hasText,data,metadata) => {
    if (!data.urlDownload.includes("pdf")) return;

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
    for (let i = 1; i <= numberOfPages; i++) {
      if(hasText.includes(i)) continue;
      const fileName = `_.${i}.jpg`;
      const imagePath = path.resolve(saveImages, fileName);
      const imageUrl = this.fileManagerClient.generateUrl(
        data,
        "postDownloads",
        fileName 
      );

      if (metadata?.force || !(await this.fileManagerClient.fileExists(imageUrl))) {
        logs.infoHistory(data,{fileName,index: i,imageUrl,message: "getting image"})
        await convert(i); 
        await this.fileManagerClient.uploadFile(imagePath, imageUrl);
      }

      await this.eventBus.emit("extractedTexts", {
        ...data,
        index: i,
        imageUrl,
      }, metadata); 
    }
    
    fs.rmdirSync(saveImages, { recursive: true });
    fs.unlinkSync(pdfPath);
  };
}
