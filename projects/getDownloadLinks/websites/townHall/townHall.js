import puppeteer from "puppeteer"

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
            await page.goto(link)
            const downloadsLink = await page.$$(".btn.btn-descargar.pull-right")
            for (const i in downloadsLink) {
                const link = await page.evaluate(el => el.href, downloadsLink[i])
                this.eventBus.emit({
                    instituctionType,
                    typeOfData: 'payroll',
                    link,
                    instituctionName
                })
            }
        }
        browser.close()
    }
}