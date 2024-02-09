const puppeteer = require("puppeteer")
const path = require("path")
void async function(){
    const browser = await puppeteer.launch(
        {
            headless: false,
            timeout: 10_000_000,
            protocolTimeout: 10_000_000
        }
    )
    const page = await browser.newPage()
    await page.goto(`https://smallpdf.com/es/pdf-a-jpg`,{ waitUntil: 'load' })
    // Locate the file input element
    const fileInput = await page.$('input[type=file]');

    // Upload file
    await fileInput.uploadFile(path.join(__dirname,"../downloadPdf/pdf/ayuntamientojarabacoa/nomina-septiembre-2018.pdf"));
}()




