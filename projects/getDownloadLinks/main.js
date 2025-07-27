import {links} from "./links.js"
import { FileManager } from "../filesAccess/fileAccess.js"
import { DownloadTownHallData } from "./websites/townHall/townHall.js"
import { EventBus } from "../eventBus/eventBus.js"

const eventBus = new EventBus({
    queueName: "downloadLink",
    exchangeName: "downloadLinks"
})

const fileManager = new FileManager()

const downloadTownHallData = new DownloadTownHallData(eventBus,fileManager)

const getDownloadLinks = async () => {
    for (const link of links) {
        await downloadTownHallData.getDownloadLinks(link)
    }
}
getDownloadLinks()