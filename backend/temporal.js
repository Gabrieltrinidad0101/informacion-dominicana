import fs from 'fs';
import path, { join } from 'path';
import { forEachFolder, isNullEmptyUndefinerNan } from './src/utils.js';
import { getPath } from './src/getPath.js';
import { constants } from './src/constants.js';

const directoryPath = '/home/gabriel-trinidad/Desktop/javascript/informacion-dominicana/dataPreprocessing/townHalls/Jarabacoa/images/2018/april';

const rename = (directoryPath) => {
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        files.forEach(file => {
            const match = file.match(/\.(\d+)\.jpg$/);
            if (match) {
                const number = match[1];
                const newName = `_${number}.jpg`;
                const oldPath = path.join(directoryPath, file);
                const newPath = path.join(directoryPath, newName);

                fs.rename(oldPath, newPath, err => {
                    if (err) {
                        console.error(`Error renaming ${file}:`, err);
                    } else {
                        console.log(`Renamed ${file} → ${newName}`);
                    }
                });
            }
        });
    });
}

await forEachFolder(constants.townHalls(), async (townHall) => {
    if (townHall === "pdfLinks.json") return
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
            rename(getDataFromDownload)
            // console.log({
            //     townHall,
            //     year,
            //     month,
            //     pdfNomina,
            //     getDataFromDownload,
            // })
        })
    })
})
