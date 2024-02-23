const {generalAnalize} = require("./general")

/**
 * 
 * @param {string} dataText 
 * @returns 
 */

const analize = async () => {
    const townHallsPath = await getPath(__dirname, "../../../../processedData/townHalls")
    const townHalls = await fs.readdir(townHallsPath)
    for (const townHall of townHalls) {
        if (path.extname(townHall) !== "") continue
        const townHallPdf = await getPath(townHallsPath, townHall, "images")
        const years = await fs.readdir(townHallPdf)
        for (const year of years) {
            const monthsPath = path.join(yearsPath,year)
            const months = monthsOrdes(await fs.readdir(monthsPath))
            for(const month of months){
                const nominaImages = path.join(monthsPath,month)
                const filePath = path.join(nominaImages,"data.txt")
                if(await fileExists(filePath)) continue
                const dataText = await fs.readFile(filePath, 'utf8');
                generalAnalize(dataText)
            }
        }
    }
}

module.exports = { analize }