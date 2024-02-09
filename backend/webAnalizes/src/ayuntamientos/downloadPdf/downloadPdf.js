const puppeteer = require("puppeteer")
const { DownloaderHelper } = require('node-downloader-helper');
const fs = require("fs")
const path = require("path")

const townHalls = [{
    link:"https:ayuntamientojarabacoa.gob.do",
    name: "ayuntamientojarabacoa"
}]

void async function(){
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    
    for(const {link,name} of townHalls ){
        await page.goto(`${link}/transparencia/documentos/nomina/`,{ waitUntil: 'load' })
        const nominationsByYear = await page.$$(".el-folder.col-lg-6.col-md-6.col-sm-6 > a")
        for(const nomination of nominationsByYear.reverse()){
            await page.goto(await page.evaluate(el => el.href, nomination),{ waitUntil: 'load' })
            const downloadsLink = await page.$$(".btn.btn-descargar.pull-right")
            for(const downloadLink of downloadsLink){
                const link = await page.evaluate(el => el.href, downloadLink)
                await downloadPdf(name,link)      
            }
        }
    }

}()


const downloadPdf = (name,link)=> new Promise((res,rej)=>{
    const folderName = path.join(__dirname,`pdf/${name}`)
    fs.mkdir(folderName,_=>{})
    const dl = new DownloaderHelper(link, folderName);
    dl.on('end', res);
    dl.on('error', rej);
    dl.start().catch(rej);
})

