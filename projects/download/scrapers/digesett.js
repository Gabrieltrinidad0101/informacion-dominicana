import { scrapeYearMonthFiles } from './scrapeYearMonthFiles.js'

async function loadAllFiles(page) {
    await Promise.all([
        page.waitForNavigation(),
        page.select('select#limit', '0')
    ])
    await new Promise(resolve => setTimeout(resolve, 3000))
}

export const scrapeDigesettLinks = (page, institutionLink) =>
    scrapeYearMonthFiles(page, institutionLink, {
        yearItemSelector: ".los-folders a",
        yearLabelSelector: ".los-folders a",
        monthItemSelector: ".attachment__container",
        monthLabelSelector: ".attachment__container .attachment__container_item .title",
        downloadLinkSelector: ".btn-descargar",
        beforeGetFiles: loadAllFiles,
        beforeGetFolders: loadAllFiles
    })
