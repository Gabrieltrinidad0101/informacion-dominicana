const puppeteer = require("puppeteer")
const { DownloaderHelper } = require('node-downloader-helper');
const fs = require("fs")
const path = require("path");
const { fileExists } = require("../../../utils");

const townHalls = [{
    link: "https:ayuntamientojarabacoa.gob.do",
    name: "ayuntamientojarabacoa"
}]


const downloadPdf = async () => {
    const browser = await puppeteer.launch({
        headless: false
    })
    const page = await browser.newPage()

    for (const { link, name } of townHalls) {
        const urlLink = `${link}/transparencia/documentos/nomina/`
        await page.goto(urlLink, { waitUntil: 'load' })
        const nominationsByYear = await page.$$(".el-folder.col-lg-6.col-md-6.col-sm-6 > a")
        console.log(`Downloading pdf from ${urlLink}`)
        for (const nomination of nominationsByYear.reverse()) {
            await page.goto(await page.evaluate(el => el.href, nomination), { waitUntil: 'load' })
            const downloadsLink = await page.$$(".btn.btn-descargar.pull-right")
            for (const downloadLink of downloadsLink) {
                const link = await page.evaluate(el => el.href, downloadLink)
                console.log(`   pdf: ${link}`)
                await savePdf(name, link)
            }
        }
    }
    browser.close()
}

const getFileNameFromURL = url => {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    const filename = path.basename(pathname);
    return filename;
}

const savePdf = (name, link) => new Promise((res, rej) => {
    const fileName = getFileNameFromURL(link)
    const folderPath = path.join(__dirname, `pdf/${name}`)
    const exist = fileExists(path.join(folderPath, fileName))
    if (exist) return
    const folderName = folderPath
    fs.mkdir(folderName, _ => { })
    const dl = new DownloaderHelper(link, folderName);
    dl.on('end', res);
    dl.on('error', rej);
    dl.start().catch(rej);
})


module.exports = { downloadPdf }