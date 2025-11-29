import { DownloadTownHallData } from "./websites/townHall/townHall.js"
import { eventBus } from "../eventBus/eventBus.js"

new DownloadTownHallData(eventBus)    