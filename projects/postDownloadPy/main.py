from fileManagerClientPy.fileManagerClient import FileManagerClient
from eventBusPy.eventBus import EventBus
from postDownloadPy.app.postDownload import PostDownload

file_manager = FileManagerClient()
event_bus = EventBus()
post_download = PostDownload(event_bus, file_manager)
print("postDownload")