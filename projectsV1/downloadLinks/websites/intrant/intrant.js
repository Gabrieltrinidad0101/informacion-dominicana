import { months } from "../months.js"

export const getIntrantLinks = async (page, { link, institutionType, institutionName }, eventBus, metadata) => {
    await page.goto(link)
    const nominationsByYearLink = await page.$$(".mt-4.grid.gap-4.sm\\:grid-cols-2.lg\\:mt-8.lg\\:gap-8 > li a")
    const nominationsByYear = await page.$$(".mt-4.grid.gap-4.sm\\:grid-cols-2.lg\\:mt-8.lg\\:gap-8 > li .flex.h-\\[40px\\].items-center.px-2")
    const datas = []
    for (const i in nominationsByYearLink) {
        datas.push({
            link: await page.evaluate(el => el.href, nominationsByYearLink[i]),
            year: await page.evaluate(el => el.textContent, nominationsByYear[i])
        })
    }
    for (const data of datas) {
        const link = data.link
        const regex = /\d{4}/
        const year = regex.exec(data.year)?.[0]
        await page.goto(link)
        const nominationsByMonthLink = await page.$$(".mt-4.grid.gap-4.sm\\:grid-cols-2.lg\\:mt-8.lg\\:gap-8 > li a")
        const nominationsByMonth = await page.$$(".mt-4.grid.gap-4.sm\\:grid-cols-2.lg\\:mt-8.lg\\:gap-8 > li .flex.h-\\[40px\\].items-center.px-2")
        const datasMonth = []
        for (const i in nominationsByMonthLink) {
            datasMonth.push({
                link: await page.evaluate(el => el.href, nominationsByMonthLink[i]),
                month: await page.evaluate(el => el.textContent, nominationsByMonth[i])
            })
        }
        for (const dataMonth of datasMonth) {
            await page.goto(dataMonth.link)
            const month = months.find(m => dataMonth.month.toLocaleLowerCase().trim().includes(m.toLocaleLowerCase()))
            const downloadsLink = await page.$$("a.cursor-newtab.inline-flex.items-center.rounded.font-medium.focus\\:outline-none.focus-visible\\:ring.focus-visible\\:ring-primary-500.shadow-sm.transition-colors.duration-75.px-3.py-1\\.5.text-sm.md\\:text-base.border.active\\:bg-primary-100.disabled\\:bg-primary-100.disabled\\:cursor-not-allowed.border-ogtic-red.text-ogtic-red.hover\\:bg-ogtic-red\\/5")
            for (const downloadsLinkElement of downloadsLink) {
                const link = await page.evaluate(el => el.href, downloadsLinkElement)
                await eventBus.emit('downloads', { institutionType, typeOfData: 'nomina', link, year, month, institutionName,fullAIProcess: true }, metadata)
            }
        }
    }
}
