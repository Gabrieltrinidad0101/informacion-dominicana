import { fromPath } from "pdf2pic";
import fs from "fs"
import pdf from "pdf-parse/lib/pdf-parse.js";
import path from "path";

/**
 * 
 * @param {string} number 
 * @param {string} savePath
 * @returns 
 */

const options = (saveFilename, savePath) => ({
  density: 700,
  savePath,
  saveFilename,
  format: "jpg",
  width: 2000,
  height: 2000
});


export class PdfToImage {
  constructor(eventBus, fileManagerClient) {
    this.eventBus = eventBus
    this.fileManagerClient = fileManagerClient
    this.eventBus.on('postDownload', 'postDownloads', this.getTextFromImage)
  }

  #getNumbersOfPages = async (pdfPath) => {
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(dataBuffer);
    return pdfData.numpages;
  }

  getTextFromImage = async (data) => {
    await this.fileManagerClient.downloadFile(data.urlDownload)
    const numberOfPages = await this.#getNumbersOfPages(data.urlDownload)
    const convert = fromPath(data.urlDownload, options("_", saveImages));
    delete data._id
    for (let i = 1; i <= numberOfPages; i++) {
      const fileName = `_.${i}.jpg`
      const imagePath = path.join('./temp/images',fileName)
      const imageUrl = this.fileManagerClient.generatePath(data, 'postDownloads', fileName)
      if(!this.fileManagerClient.fileExists(imagePath)) {
        await convert.bulk(i)
        await this.fileManagerClient.uploadFile(imagePath,imageUrl)
      }
      this.eventBus.emit(
        'extractedTexts',
        {
        ...data,
        index: i,
        imageUrl
      })
    }
  }
}
