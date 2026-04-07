import 'dotenv/config'
import puppeteer from 'puppeteer'
import path from 'path'
import { URL } from 'url'
import { institutions } from '../shared/institutions.js'
import { FileManagerClient } from '../shared/fileManagerClient.js'
import { scrapeTownHallLinks } from './scrapers/townHall.js'

const scrapers = {
    ayuntamiento: scrapeTownHallLinks
}

const institutionKey = process.argv[2]
if (!institutionKey) {
    console.error('Usage: node reBuild/download/main.js <institutionKey>')
    console.error('Available:', Object.keys(institutions).join(', '))
    process.exit(1)
}

const institution = institutions[institutionKey]
if (!institution) {
    console.error(`Unknown institution: "${institutionKey}"`)
    console.error('Available:', Object.keys(institutions).join(', '))
    process.exit(1)
}

const scrape = scrapers[institution.institutionType]
if (!scrape) {
    console.error(`No scraper for institutionType: "${institution.institutionType}"`)
    process.exit(1)
}

const fileManagerClient = new FileManagerClient()

console.log(`Scraping links for: ${institution.institutionName}`)
const browser = await puppeteer.launch({
    executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
})

const page = await browser.newPage()
await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

const links = await scrape(page, institution.link)
await browser.close()

console.log(`Found ${links.length} file(s) to download`)

for (const { link, year, month } of links) {
    const filename = path.basename(new URL(link).pathname)
    const minioKey = `${institution.institutionName}/${institution.typeOfData}/download/${year}/${month}/${filename}`

    const exists = await fileManagerClient.fileExists(minioKey)
    if (exists) {
        console.log(`Skip (already exists): ${minioKey}`)
        continue
    }

    console.log(`Downloading: ${link}`)
    await fileManagerClient.uploadFileFromUrl(link, minioKey)
    console.log(`Uploaded: ${minioKey}`)
}

console.log('Done.')
