import 'dotenv/config'
import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs/promises'
import { URL } from 'url'
import { institutions } from '../shared/institutions.js'
import { FileManagerClient } from '../shared/fileManagerClient.js'
import { scrapeTownHallLinks } from './scrapers/townHall.js'

const scrapers = {
    ayuntamiento: scrapeTownHallLinks
}

const args = process.argv.slice(2)
const retryMode = args.includes('--retry')
const institutionKey = args.find(a => !a.startsWith('--'))

if (!institutionKey) {
    console.error('Usage: node ./download/main.js <institutionKey> [--retry]')
    console.error('Available:', Object.keys(institutions).join(', '))
    process.exit(1)
}

const institution = institutions[institutionKey]
if (!institution) {
    console.error(`Unknown institution: "${institutionKey}"`)
    console.error('Available:', Object.keys(institutions).join(', '))
    process.exit(1)
}

const errorsFile = `./download/errors-${institutionKey}.json`

const fileManagerClient = new FileManagerClient()

let links

if (retryMode) {
    let erroredLinks
    try {
        erroredLinks = JSON.parse(await fs.readFile(errorsFile, 'utf-8'))
    } catch {
        console.error(`No errors file found for "${institutionKey}" (${errorsFile})`)
        process.exit(1)
    }
    links = erroredLinks
    console.log(`Retry mode: ${links.length} failed file(s) to retry`)
} else {
    const scrape = scrapers[institution.institutionType]
    if (!scrape) {
        console.error(`No scraper for institutionType: "${institution.institutionType}"`)
        process.exit(1)
    }

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

    links = await scrape(page, institution.link)
    await browser.close()
    console.log(`Found ${links.length} file(s) to download`)
}

const failed = []

for (const { link, year, month } of links) {
    const filename = path.basename(new URL(link).pathname)
    const minioKey = `${institution.institutionName}/${institution.typeOfData}/download/${year}/${month}/${filename}`

    const exists = await fileManagerClient.fileExists(minioKey)
    if (exists) {
        console.log(`Skip (already exists): ${minioKey}`)
        continue
    }

    try {
        console.log(`Downloading: ${link}`)
        await fileManagerClient.uploadFileFromUrl(link, minioKey)
        console.log(`Uploaded: ${minioKey}`)
    } catch (err) {
        console.error(`Failed: ${link} — ${err.message}`)
        failed.push({ link, year, month })
    }
}

if (failed.length > 0) {
    await fs.writeFile(errorsFile, JSON.stringify(failed, null, 2))
    console.log(`\n${failed.length} error(s) saved to ${errorsFile}`)
} else if (retryMode) {
    await fs.rm(errorsFile, { force: true })
    console.log(`All retries succeeded, removed ${errorsFile}`)
}

console.log('Done.')
