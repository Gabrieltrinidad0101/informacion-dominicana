import { scrapeYearMonthFiles } from './scrapeYearMonthFiles.js'

const GRID_ITEM = ".mt-4.grid.gap-4.sm\\:grid-cols-2.lg\\:mt-8.lg\\:gap-8 > li a"
const GRID_LABEL = ".mt-4.grid.gap-4.sm\\:grid-cols-2.lg\\:mt-8.lg\\:gap-8 > li .flex.h-\\[40px\\].items-center.px-2"
const DOWNLOAD_LINK = "a.cursor-newtab.inline-flex.items-center.rounded.font-medium.focus\\:outline-none.focus-visible\\:ring.focus-visible\\:ring-primary-500.shadow-sm.transition-colors.duration-75.px-3.py-1\\.5.text-sm.md\\:text-base.border.active\\:bg-primary-100.disabled\\:bg-primary-100.disabled\\:cursor-not-allowed.border-ogtic-red.text-ogtic-red.hover\\:bg-ogtic-red\\/5"

export const scrapeIntrantLinks = (page, institutionLink) =>
    scrapeYearMonthFiles(page, institutionLink, {
        yearItemSelector: GRID_ITEM,
        yearLabelSelector: GRID_LABEL,
        monthItemSelector: GRID_ITEM,
        monthLabelSelector: GRID_LABEL,
        downloadLinkSelector: DOWNLOAD_LINK,
        keepFile: link => !link.toLowerCase().endsWith('.pdf')
    })
