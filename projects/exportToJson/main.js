import { Payroll } from './payroll.js';
import { Repository } from './repository.js';
import { eventBus } from "../eventBus/eventBus.js"
import { FileManagerClient } from "../fileManagerClient/main.js"

const fileAccess = new FileManagerClient();
const repository = new Repository();
new Payroll(repository,eventBus,fileAccess); 