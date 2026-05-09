const MONTHS = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
]

function parseMonth(text) {
    return MONTHS.find(m => text.toLowerCase().trim().includes(m)) ?? "desconocido"
}

async function getPageItems(page, linkSelector, labelSelector) {
    const linkEls = await page.$$(linkSelector)
    const labelEls = await page.$$(labelSelector)
    const items = []
    for (const i in linkEls) {
        items.push({
            link: await page.evaluate(el => el.href, linkEls[i]),
            text: (await page.evaluate(el => el.textContent, labelEls[i])).trim()
        })
    }
    return items
}

async function getFrameWithSelector(page, selector) {
    await page.waitForSelector(selector, { timeout: 10000 }).catch(() => null)
    for (const frame of page.frames()) {
        const els = await frame.$$(selector)
        if (els.length > 0) return frame
    }
    return page.mainFrame()
}

export async function scrapeYearMonthFiles(page, institutionLink, {
    yearItemSelector,
    yearLabelSelector,
    monthItemSelector,
    monthLabelSelector,
    downloadLinkSelector,
    beforeGetFiles = async () => { },
    beforeGetFolders = async () => { }, // TODO: implement this
    keepFile = () => true
}) {
    await page.goto(institutionLink)
    await beforeGetFolders(page)

    const yearItems = await getPageItems(page, yearItemSelector, yearLabelSelector)


    const results = []
    for (const { link: yearLink, text: yearText } of yearItems) {
        const year = /\d{4}/.exec(yearText)?.[0]
        if (!year) continue
        await page.goto(yearLink)
        const frame = await getFrameWithSelector(page, monthItemSelector)
        const monthCount = (await frame.$$(monthItemSelector)).length
        for (let i = 0; i < monthCount; i++) {
            const labelEl = (await frame.$$(monthLabelSelector))[i]
            const monthText = (await page.evaluate(el => el.textContent, labelEl)).trim()
            const month = parseMonth(monthText)

            await labelEl.click()

            const fileEls = await frame.$$(downloadLinkSelector)
            for (const el of fileEls) {
                const fileLink = await page.evaluate(e => e.href, el)
                if (keepFile(fileLink)) {
                    results.push({ link: fileLink, year, month })
                }
            }

            await (await frame.$$(monthLabelSelector))[i].click()
        }
    }

    return results
}



export const scrapeMopcLinks = (page, institutionLink) =>
    scrapeYearMonthFiles(page, institutionLink, {
        beforeGetFolders: async () => {
            await new Promise(resolve => setTimeout(resolve, 5000))
        },
        yearItemSelector: ".container > div:nth-child(3) .w-full .py-3 .w-full .text-sm a",
        yearLabelSelector: ".container > div:nth-child(3) .w-full .py-3 .w-full .text-sm a .font-semibold.leading-snug.line-clamp-5.text-mopc-carbon-black.transition-colors.duration-300",
        monthItemSelector: ".container > div:nth-child(4) .py-3 .text-sm > div",
        monthLabelSelector: ".container > div:nth-child(4) .py-3 .text-sm > div > header span:nth-child(1)",
        downloadLinkSelector: ".container > div:nth-child(4) .py-3 .text-sm > div > div a",
        keepFile: (link) => !link.endsWith('.pdf')
    })


