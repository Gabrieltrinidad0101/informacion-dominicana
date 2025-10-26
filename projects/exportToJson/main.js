import { Payroll } from './payroll.js';
import { Repository } from './repository.js';
import { EventBus } from "../eventBus/eventBus.js"
import { FileManagerClient } from "../fileManagerClient/main.js"

const eventBus = new EventBus();
const fileAccess = new FileManagerClient();
const repository = new Repository();
new Payroll(repository,eventBus,fileAccess);