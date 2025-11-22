import { DownloadTownHallData } from "./websites/townHall/townHall.js"
import { eventBus } from "../eventBus/eventBus.js"

const eventBus = new EventBus()
new DownloadTownHallData(eventBus)    