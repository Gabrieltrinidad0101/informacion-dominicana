import puppeteer from "puppeteer"
import { DownloaderHelper } from 'node-downloader-helper';
import fs from "fs"
import path from "path";
import { fileExists, getMonth, isNullEmptyUndefinerNan } from "../../utils.js";
import { constants } from "../../constants.js";

const townHalls = [{
    link: "https:ayuntamientojarabacoa.gob.do",
    townHall: "Jarabacoa"
}]

export const downloadData = async () => {
    let links = []
    const filePath = path.join(constants.townHalls(),"pdfLinks.json")
    if (fileExists(filePath)){
        links = JSON.parse(fs.readFileSync(filePath))
    }
    else{
        links = await getDownloadLinks(filePath)
        fs.writeFileSync(filePath,JSON.stringify(links))
    }
    await downloadFiles(links)
}


const getDownloadLinks = async () => {
    const browser = await puppeteer.launch({
        headless: false
    })
    const page = await browser.newPage()

    const townHallsLink = []
    for (const { link, townHall } of townHalls) {
        const urlLink = `${link}/transparencia/documentos/nomina/`
        await page.goto(urlLink)
        const nominationsByYearLink = await page.$$(".el-folder.col-lg-6.col-md-6.col-sm-6 > a")
        const nominationsByYear = await page.$$(".el-folder.col-lg-6.col-md-6.col-sm-6")
        console.log(`Downloading pdf from ${urlLink}`)
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
            const payrolls = await page.$$(".name")
            for (const i in downloadsLink) {
                const link = await page.evaluate(el => el.href, downloadsLink[i])
                const payroll = await page.evaluate(el => el.textContent, payrolls[i])
                const regex = /\d{4}/
                const year = regex.exec(data.year)
                const {fileName,folderPath} = filePath({link,townHall,year: year[0]})
                townHallsLink.push({
                    townHall,
                    payroll,
                    link,
                    year: year[0],
                    fileName,
                    folderPath
                })
            }
        }
    }
    browser.close()
    return townHallsLink
}

/**
 * 
 * @param {Array<{name: string,year: number,link: string,payroll: string}>} linkData 
 * @returns 
 */

const downloadFiles = async (linkData) =>{
    for(const data of linkData){
        const filePath = data.fileName
        if (fileExists(path.join(data.folderPath,data.fileName))) continue
        console.log(`downloading: ${data.year} ${filePath} link: ${data.link}`)
        await download(data.link,data.folderPath,data.fileName)
    }
}

const filePath = ({link,townHall,year})=>{
    let folderPath = ""
    if(path.extname(link) == ".xlsx") {
        folderPath = constants.preData(townHall,year)
    }else
        folderPath = constants.downloadData(townHall,year) 
    return {folderPath,fileName: getFilename(link)}
}

const download = (link,folderPath,fileName) => new Promise(async (res, rej) => {
    if(folderPath === "") return
    const dl = new DownloaderHelper(link, folderPath,{
        fileName
    });
    dl.on('end', res);
    dl.on('error', rej);
    dl.start().catch(rej);
})

const getFilename =(fileName)=>{
    const month = getMonth(path.parse(fileName).name) 
    const extname = path.extname(fileName)
    if(isNullEmptyUndefinerNan(month)) return ""
    return `${month}${extname}`
}
