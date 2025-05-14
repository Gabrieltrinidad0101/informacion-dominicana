import path from "path";
import { fromPath } from "pdf2pic";
import { forEachFolder, isNullEmptyUndefinerNan } from "../../utils.js";
import { constants } from "../../constants.js";
import { promises as fs } from "fs"

const options = (townHall,savePath) => ({
  density: 700,
  saveFilename: `${townHall}TownHall`,
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
    if(townHall === "pdfLinks.json") return
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
        await new Promise(res => setTimeout(res, 10000))
      })
    })
  })
}

const getImageFromPdf = async ({ townHall, year, month, pdfNomina, getDataFromDownload, files }) => {
  const folderImagesTemp = constants.images(townHall, year, month)
  const imagesTemp = await fs.readdir(folderImagesTemp)

  if (files.length > 0) return
  console.log(`Getting image from pdf ${getDataFromDownload}`)
  if (imagesTemp.length <= 0) {
    const convert = fromPath(pdfNomina, options(townHall,folderImagesTemp));
    await convert.bulk(-1)
  }
}
