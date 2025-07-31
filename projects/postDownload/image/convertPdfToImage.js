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
  constructor(eventBus, fileManager) {
    this.eventBus = eventBus
    this.fileManager = fileManager
    this.eventBus.on('postDownload', 'postDownloads', this.getTextFromImage)
  }

  #getNumbersOfPages = async (pdfPath) => {
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(dataBuffer);
    return pdfData.numpages;
  }

  getTextFromImage = async (data) => {
    const saveImages = this.fileManager.makePath(data.instituctionName, data.typeOfData, 'postDownloads', data.year, data.month)
    const numberOfPages = await this.#getNumbersOfPages(data.fileAccess)
    const convert = fromPath(data.fileAccess, options("_", saveImages));
    for (let i = 1; i <= numberOfPages; i++) {
      const fileAccess = path.join(saveImages,`_.${i}.jpg`)
      if(!this.fileManager.fileExists(fileAccess)) {
        await convert.bulk(i)
      }
      this.eventBus.emit(
        'extractedTexts',
        {
        ...data,
        index: i,
        fileAccess: fileAccess
      })
    }
  }
}
