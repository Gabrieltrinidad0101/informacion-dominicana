import { scrapeYearMonthFiles } from './scrapeYearMonthFiles.js'

const GRID_ITEM = ".folder-grid.row.g-1 a"
const GRID_LABEL = ".archivo-title strong"
const DOWNLOAD_LINK = ".archivo-descargar a"

export const scrapeOgticLinks = (page, institutionLink) =>
    scrapeYearMonthFiles(page, institutionLink, {
        yearItemSelector: GRID_ITEM,
        yearLabelSelector: ".folder-title",
        monthItemSelector: GRID_ITEM,
        monthLabelSelector: ".folder-title",
        downloadLinkSelector: DOWNLOAD_LINK,
        keepFile: link => !link.toLowerCase().endsWith('.pdf')
    })
