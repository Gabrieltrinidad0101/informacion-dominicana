import path from "path";
import { fromPath } from "pdf2pic";
import { promises as fs } from "fs"

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

  getTextFromImage = async (data) => {
    const saveImages = this.fileManager.makePath(data.instituctionName, data.typeOfData, 'images', data.year, data.month)
    const convert = fromPath(data.fileAccess, options("_", saveImages));
    await convert.bulk(-1)
    const files = fs.readdirSync(saveImages);
    for (const file of files) {
      this.eventBus.emit({
        ...data,
        fileAccess: path.join(saveImages, file)
      })
    }
  }
}
