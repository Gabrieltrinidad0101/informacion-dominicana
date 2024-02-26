const puppeteer = require("puppeteer")
const { DownloaderHelper } = require('node-downloader-helper');
const fs = require("fs").promises
const path = require("path");
const { fileExists, getMonth } = require("../../utils");

const townHalls = [{
    link: "https:ayuntamientojarabacoa.gob.do",
    name: "ayuntamiento_jarabacoa"
}]

const downloadData = async () => {
    let links = []
    const filePath = path.join(__dirname,"../../../../processedData/townHalls/pdfLinks.json")
    if (await fileExists(filePath)){
        links = JSON.parse(await fs.readFile(filePath))
    }
    else{
        links = await getLinkPdf(filePath)
        fs.writeFile(filePath,JSON.stringify(links))
    }
    await savePdf(links)
}


const getLinkPdf = async () => {
    const browser = await puppeteer.launch({
        headless: false
    })
    const page = await browser.newPage()

    const townHallsLink = []
    for (const { link, name } of townHalls) {
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
                townHallsLink.push({
                    name,
                    payroll,
                    link,
                    year: year[0]
                })
            }
        }
    }
    browser.close()
    return townHallsLink
}


const getFileNameFromURL = url => {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    const filename = path.basename(pathname);
    return filename;
}

/**
 * 
 * @param {Array<{name: string,year: number,link: string,payroll: string}>} linkData 
 * @returns 
 */

const savePdf = async (linkData) =>{
    for(const data of linkData){
        const fileName = getFileNameFromURL(data.link)
        if(path.extname(fileName) !== ".pdf") continue
        const folderPath = path.join(__dirname,`../../../../processedData/townHalls/${data.name}/pdf/${data.year}`)
        fs.mkdir(folderPath,{
            recursive: true
        }, _ => { })
        const filePath = path.join(folderPath, fileName)
        if (await fileExists(filePath)) continue
        console.log(`       into: ${filePath}`)
        await download(data.link,folderPath)
    }
}

const download = (link,folderPath) => new Promise(async (res, rej) => {
    const dl = new DownloaderHelper(link, folderPath);
    dl.on('end', res);
    dl.on('error', rej);
    dl.start().catch(rej);
})


module.exports = { downloadPdf }