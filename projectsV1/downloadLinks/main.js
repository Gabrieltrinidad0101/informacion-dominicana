import puppeteer from "puppeteer"
import { getTownHallLinks } from "./websites/townHall/townHall.js"
import { getIntrantLinks } from "./websites/intrant/intrant.js"
import { eventBus } from "../eventBus/eventBus.js"

const handlers = {
    ayuntamiento: getTownHallLinks,
    intrant: getIntrantLinks,
}

class DownloadLinks {
    constructor(eventBus) {
        this.eventBus = eventBus
        this.eventBus.on('downloadLink', 'downloadLinks', this.getDownloadLinks)
    }

    getDownloadLinks = async (event, metadata) => {
        const handler = handlers[event.institutionType]
        if (!handler) return
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium',
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
        const page = await browser.newPage()
        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        await handler(page, event, this.eventBus, metadata)
        browser.close()
    }
}

new DownloadLinks(eventBus)
