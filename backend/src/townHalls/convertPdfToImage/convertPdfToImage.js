import path from "path";
import { fromPath } from "pdf2pic";
import sharp from 'sharp';
import { fileExists, forEachFolder, isNullEmptyUndefinerNan } from "../../utils.js";
import Tesseract from 'tesseract.js';
import { constants } from "../../constants.js";
import { fixesRotationImages } from "./fixes.js";
import { promises as fs } from "fs"

const options = (savePath) => ({
  density: 700,
  saveFilename: "jarabacoaTownHall",
  savePath,
  format: "jpg",
  width: 2000,
  height: 2000
});


const getPath = async (...paths) => {
  try {
    const pathToReturn = path.join(...paths)
    if (pathToReturn === "") return pathToReturn
    await fs.mkdir(pathToReturn, { recursive: true })
    return pathToReturn
  } catch (err) {
    console.log(paths, "   ", err)
  }
}

const join = (...paths) => path.join(...paths)

export const convertPdfToImage = async () => {
  await forEachFolder(constants.townHalls(), async (townHall) => {
    const townHallPdf = constants.downloadData(townHall)
    await forEachFolder(townHallPdf, async (year) => {
      await forEachFolder(await getPath(townHallPdf, year), async (payroll) => {
        const pdfNomina = join(townHallPdf, year, payroll)
        const month = path.parse(pdfNomina).name
        if (isNullEmptyUndefinerNan(month)) {
          console.log(`Error getting month in ${pdfNomina}`)
          return
        }
        const getDataFromDownload = constants.images(townHall, year, month)
        const files = await fs.readdir(getDataFromDownload)
        if (files.length > 0 && !path.extname(files[0])) return
        await getImageFromPdf({
          townHall,
          year,
          month,
          pdfNomina,
          getDataFromDownload,
          files
        })
      })
      await new Promise(res => setTimeout(res, 2000))
    })
  })
}

const getImageFromPdf = async ({ townHall, year, month, pdfNomina, getDataFromDownload, files }) => {
  const folderImagesTemp = constants.imagesTemp(townHall, year, month)
  const imagesTemp = await fs.readdir(folderImagesTemp)

  if (files.length > 0) return
  if (imagesTemp.length <= 0) {
    const convert = fromPath(pdfNomina, options(folderImagesTemp));
    await convert.bulk(-1)
  }
  console.log(`Getting image from pdf ${getDataFromDownload}`)
  for (const image of imagesTemp) {
    await processImage(image, path.join(folderImagesTemp, image), getDataFromDownload)
  }
}

const processImage = (file, fileFullpath, folderImages) => new Promise(async (res, rej) => {
  const fileName = path.join(folderImages, file)
  if (fileExists(fileName)) return res()
  const image = sharp(fileFullpath)

  image
    .resize({
      width: 1700 * 2,
      height: 1150 * 2
    })
    .toFile(fileName, (err, info) => {
      if (err) {
        rej(err)
        console.error('Error occurred while cropping the image:', err);
        return;
      }
      res()
      console.log(`       image: ${fileName}`);
    });
})
