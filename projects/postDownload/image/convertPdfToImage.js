import path from "path";
import { fromPath } from "pdf2pic";
import { fs } from "fs"
import pdf from "pdf-parse";

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
    this.eventBus.on('download', this.getTextFromImage)
  }

  #getNumbersOfPages = async (pdfPath) => {
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(dataBuffer);
    return pdfData.numpages;
  }

  getTextFromImage = async (data) => {
    const saveImages = this.fileManager.makePath(data.instituctionName, data.typeOfData, 'images', data.year, data.month)
    const numberOfPages = await this.#getNumbersOfPages(data.fileAccess)
    const convert = fromPath(data.fileAccess, options("_", saveImages));
    for (let i = 1; i <= numberOfPages; i++) {
      const result = await convert.bulk(i)
      const fileAccess = this.fileManager.saveFile(data.instituctionName, data.typeOfData, 'images', data.year, data.month, result.buffer);
      this.eventBus.emit({
        ...data,
        index: i,
        fileAccess: fileAccess
      })
    }
  }
}
