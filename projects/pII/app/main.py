from fileManagerClient.main import FileManagerClient
from eventBus.main import EventBus
from pii.main import PII


file_manager = FileManagerClient()
event_bus = EventBus()
pii = PII(event_bus, file_manager)
