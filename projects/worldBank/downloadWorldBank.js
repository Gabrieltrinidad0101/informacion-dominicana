import AdmZip from 'adm-zip'
import convert from 'xml-js'

export const downloadWorldBank = async () => {
    const response = await fetch('https://api.worldbank.org/v2/es/country/DOM?downloadformat=xml')
    const buffer = Buffer.from(await response.arrayBuffer())

    const zip = new AdmZip(buffer)
    const xmlEntry = zip.getEntries().find(e => e.entryName.endsWith('.xml'))
    const xml = xmlEntry.getData().toString('utf-8')

    const jsonData = convert.xml2js(xml, { compact: true, spaces: 0 })
    return jsonData.Root.data.record
}
