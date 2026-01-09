from fileManagerClientPy.fileManagerClient import FileManagerClient
from eventBusPy.eventBus import EventBus
from pII.app.pii import PII

file_manager = FileManagerClient()
event_bus = EventBus()
pii = PII(event_bus, file_manager)
print("PII")