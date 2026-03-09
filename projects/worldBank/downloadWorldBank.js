export const downloadWorldBank = async () => {
    const records = []
    let page = 1
    let pages = 1

    while (page <= pages) {
        const res = await fetch(
            `https://api.worldbank.org/v2/country/DOM/indicator?language=es&format=json&per_page=1000&page=${page}`
        )
        const [meta, data] = await res.json()
        pages = meta.pages
        if (data) records.push(...data)
        page++
    }

    return records
}
