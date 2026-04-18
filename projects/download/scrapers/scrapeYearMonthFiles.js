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
        const monthItems = await getPageItems(page, monthItemSelector, monthLabelSelector)

        for (const { link: monthLink, text: monthText } of monthItems) {
            const month = parseMonth(monthText)

            await page.goto(monthLink)
            await beforeGetFiles(page)

            const fileEls = await page.$$(downloadLinkSelector)
            for (const el of fileEls) {
                const fileLink = await page.evaluate(e => e.href, el)
                if (keepFile(fileLink)) {
                    results.push({ link: fileLink, year, month })
                }
            }
        }
    }

    return results
}
