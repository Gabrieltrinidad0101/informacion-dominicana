import puppeteer from "puppeteer"
import { DownloaderHelper } from 'node-downloader-helper';

class DownloadTownHallData {
    constructor(eventBus, fileManager) {
        this.eventBus = eventBus
        this.fileManager = fileManager
    }

    getDownloadLinks = async ({
        link,
        instituction
    }) => {
        const browser = await puppeteer.launch({
            headless: false
        })
        const page = await browser.newPage()
        await page.goto(link)
        const nominationsByYearLink = await page.$$(".el-folder.col-lg-6.col-md-6.col-sm-6 > a")
        const nominationsByYear = await page.$$(".el-folder.col-lg-6.col-md-6.col-sm-6")
        const datas = []
        for (const i in nominationsByYearLink) {
            datas.push({
                link: await page.evaluate(el => el.href, nominationsByYearLink[i]),
                year: await page.evaluate(el => el.textContent, nominationsByYear[i])
            })
        }

        for (const data of datas) {
            const link = data.link
            await page.goto(link)
            const downloadsLink = await page.$$(".btn.btn-descargar.pull-right")
            for (const i in downloadsLink) {
                const link = await page.evaluate(el => el.href, downloadsLink[i])
                this.eventBus.emit('downloadLink',{
                    instituction,
                    link,
                })
            }
        }
        browser.close()
    }
}



/**
 * 
 * @param {Array<{name: string,year: number,link: string,payroll: string}>} linkData 
 * @returns 
 */

const downloadFiles = async (linkData) => {
    
}

const filePath = ({ link, townHall, year }) => {
    let folderPath = ""
    if (path.extname(link) == ".xlsx") {
        folderPath = constants.preData(townHall, year)
    } else
        folderPath = constants.downloadData(townHall, year)
    return { folderPath, fileName: getFilename(link) }
}

const download = (link, folderPath, fileName) => new Promise(async (res, rej) => {
    if (folderPath === "") return
    const dl = new DownloaderHelper(link, folderPath, {
        fileName
    });
    dl.on('end', res);
    dl.on('error', rej);
    dl.start().catch(rej);
})

const getFilename = (fileName) => {
    const month = getMonth(path.parse(fileName).name)
    const extname = path.extname(fileName)
    if (isNullEmptyUndefinerNan(month)) return ""
    return `${month}${extname}`
}
