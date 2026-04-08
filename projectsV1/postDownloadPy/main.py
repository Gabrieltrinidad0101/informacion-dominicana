from fileManagerClientPy.fileManagerClient import FileManagerClient
from eventBusPy.eventBus import EventBus
from postDownloadPy.app.postDownload import PostDownload

file_manager = FileManagerClient()
event_bus = EventBus()
event_bus.prefetch(40)
post_download = PostDownload(event_bus, file_manager)
print("postDownload")