const puppeteer = require("puppeteer")
const townHalls = ["https:ayuntamientojarabacoa.gob.do"]

void async function(){
    const browser = await puppeteer.launch(
        {
            headless: false,
            timeout: 10_000_000,
            protocolTimeout: 10_000_000
        }
    )
    const page = await browser.newPage()
    
    await page.goto(`${townHalls[0]}/transparencia/documentos/nomina/`,{ waitUntil: 'load' })
    const nominationsByYear = await page.$$(".el-folder.col-lg-6.col-md-6.col-sm-6 > a")
    for(const nomination of nominationsByYear.reverse()){
        await page.goto(await page.evaluate(el => el.href, nomination),{ waitUntil: 'load' })
        const downloadsLink = await page.$$(".btn.btn-descargar.pull-right")
        for(const downloadLink of downloadsLink){
            console.log(await page.evaluate(el => el.href, downloadLink))
        }
    }
}()