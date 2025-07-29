class PostIaTextAnalyze {
    constructor(eventBus, fileManager) {
        this.eventBus = eventBus
        this.fileManager = fileManager
    }

    postIaTextAnalyze = async (data) => {
        const fileAccess = this.fileManager.getFile(data.fileAccess)
        const response = await this.fileManager.getFile(fileAccess)
        this.eventBus.emit('postIaTextAnalyze', { ...data, response })
    }

}