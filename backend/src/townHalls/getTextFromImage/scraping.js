import puppeteer from "puppeteer"
import { wait } from "../../utils.js"

export class WebScrapingImageToText{
    #page
    #fileInput
    #isFirst 
    start = async ()=> {
        const browser = await puppeteer.launch({
          headless: false,
          timeout: 3000000,
          protocolTimeout: 3000000,
        })
        
        this.#page = await browser.newPage()
        this.#page.setDefaultNavigationTimeout(0)
        await this.#page.goto("https://www.editpad.org/tool/extract-text-from-image",{waitUntil: 'domcontentloaded'})
    }
    
    getText = async (imagePath) => {
        if(this.#isFirst){
            await this.#page.evaluate(() => {
                document.querySelector("#start__over")?.click()
            })
        }
        await this.#page.waitForSelector('input[type=file]')
        this.#fileInput = await this.#page.$('input[type=file]');
        await this.#fileInput.uploadFile(imagePath);
        await wait(10000)
        await this.#page.evaluate(() => {
            extractImage()
        })
        await wait(10000)
        await this.#page.waitForSelector('.response__text')
        const element = await this.#page.$('.response__text')
        const value = await this.#page.evaluate(el => el.textContent, element)
        this.#isFirst = true
        return value
    }
}
