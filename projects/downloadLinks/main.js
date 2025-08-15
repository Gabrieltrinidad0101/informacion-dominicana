import {links} from "./links.js"
import { DownloadTownHallData } from "./websites/townHall/townHall.js"
import { EventBus } from "../eventBus/eventBus.js"

const eventBus = new EventBus()


const downloadTownHallData = new DownloadTownHallData(eventBus)
