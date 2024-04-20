import puppeteer from "puppeteer"
import { wait } from "../../utils.js"

export class WebScrapingImageToText{
    #page
    #fileInput
    start = async ()=> {
        const browser = await puppeteer.launch({
          headless: false,
          timeout: 3000000,
          protocolTimeout: 3000000,
        })
        
        this.#page = await browser.newPage()
        await this.#page.goto("https://www.prepostseo.com/image-to-text")
        this.#fileInput = await this.#page.$('input[type=file]');
    }
    
    getText = async (imagePath) => {
        await this.#fileInput.uploadFile(imagePath);
        await wait(10000)
        await this.#page.click("#checkBtn")
        await wait(20000)
        await this.#page.waitForSelector('#textt0')
        const element = await this.#page.$('#textt0')
        const value = await this.#page.evaluate(el => el.textContent, element)
        return value
    }
}
