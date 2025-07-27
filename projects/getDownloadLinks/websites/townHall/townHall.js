import puppeteer from "puppeteer"
import { months } from "./months.js"

export class DownloadTownHallData {
    constructor(eventBus, fileManager) {
        this.eventBus = eventBus
        this.fileManager = fileManager
    }

    getDownloadLinks = async ({
        link,
        instituctionType,
        instituctionName
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
            const regex = /\d{4}/
            const year = regex.exec(data.year)?.[0]
            await page.goto(link)
            const downloadsLink = await page.$$(".btn.btn-descargar.pull-right")
            for (const i in downloadsLink) {
                const monthText = await page.$$eval('.name', (elements, index) => {
                    return elements[index]?.textContent.trim();
                }, i)
                const month = months.find(month => monthText.toLocaleLowerCase().trim().includes(month.toLocaleLowerCase()))
                const link = await page.evaluate(el => el.href, downloadsLink[i])
                this.eventBus.emit({
                    instituctionType,
                    typeOfData: 'nomina',
                    link,
                    year,
                    month,
                    instituctionName
                })
                browser.close()
                return 
            }
        }
        browser.close()
    }
}