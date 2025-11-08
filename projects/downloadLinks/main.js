import { DownloadTownHallData } from "./websites/townHall/townHall.js"
import { EventBus } from "../eventBus/eventBus.js"

const eventBus = new EventBus()
new DownloadTownHallData(eventBus)     