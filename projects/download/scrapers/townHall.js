const months = [
    "diciembre", "noviembre", "octubre", "septiembre",
    "agosto", "julio", "junio", "mayo",
    "abril", "marzo", "febrero", "enero"
]

// Returns array of { link, year, month }
export const scrapeTownHallLinks = async (page, institutionLink) => {
    await page.goto(institutionLink)

    const yearLinks = await page.$$(".el-folder.col-lg-6.col-md-6.col-sm-6 > a")
    const yearFolders = await page.$$(".el-folder.col-lg-6.col-md-6.col-sm-6")

    const yearData = []
    for (const i in yearLinks) {
        yearData.push({
            link: await page.evaluate(el => el.href, yearLinks[i]),
            text: await page.evaluate(el => el.textContent, yearFolders[i])
        })
    }

    const results = []
    for (const { link, text } of yearData) {
        const year = /\d{4}/.exec(text)?.[0]
        if (!year) continue

        await page.goto(link)
        const downloadButtons = await page.$$(".btn.btn-descargar.pull-right")
        const nameElements = await page.$$(".name")

        for (const i in downloadButtons) {
            const monthText = nameElements[i]
                ? await page.evaluate(el => el.textContent.trim(), nameElements[i])
                : ""
            const month = months.find(m => monthText.toLowerCase().includes(m))
            const fileLink = await page.evaluate(el => el.href, downloadButtons[i])
            results.push({ link: fileLink, year, month: month ?? "desconocido" })
        }
    }

    return results
}
