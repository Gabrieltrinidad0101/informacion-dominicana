import { Payroll } from './payroll.js';
import { Repository } from './repository.js';
import { EventBus } from "../eventBus/eventBus.js"
import { FileManager } from "../filesAccess/fileAccess.js"

const eventBus = new EventBus();
const fileAccess = new FileManager();
const repository = new Repository();
const payroll = new Payroll(repository,eventBus,fileAccess);
repository.insertDefaultValues();