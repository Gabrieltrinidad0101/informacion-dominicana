import { describe, expect, it } from 'vitest'
import { eventBus } from '../eventBus/eventBus'
import { FileManagerClient } from '../fileManagerClient/main.js'

class EventBusTest {
  fileManagerClient = new FileManagerClient()
  eventBus = eventBus

  resolvers = {
    downloads: null,
    postDownloads: null,
    extractedTexts: null,
    extractedTextAnalyzers: null,
    aiTextAnalyzers: null,
    insertDatas: null
  }

  promises = {
    downloads: new Promise(res => (this.resolvers.downloads = res)),
    postDownloads: new Promise(res => (this.resolvers.postDownloads = res)),
    aiTextAnalyzers: new Promise(res => (this.resolvers.aiTextAnalyzers = res)),
    insertDatas: new Promise(res => (this.resolvers.insertDatas = res))
  }

  constructor() {
    this.eventBus.testMode = true
    this.eventBus.on('testDownload', 'downloads', this.downloads)
    this.eventBus.on('testGetPostDownloads', 'postDownloads', this.postDownloads)
    this.eventBus.on('testExtractedText', 'extractedTexts', this.extractedTexts)
    this.eventBus.on('testExtractedTextAnalyzer', 'extractedTextAnalyzers', this.extractedTextAnalyzers)
    this.eventBus.on('testAiTextAnalyzer', 'aiTextAnalyzers', this.aiTextAnalyzers)
    this.eventBus.on('testInsertData', 'insertDatas', this.insertDatas)
  }

  start() {
    this.eventBus.emit('downloads', {
      exchangeName: 'downloads',
      institutionName: 'Test',
      institutionType: 'ayuntamiento',
      link: 'https://ayuntamientojarabacoa.gob.do/transparencia/wp-content/uploads/2026/01/nomina-correspondiente-al-mes-de-Diciembre-2025.pdf',
      month: 'diciembre',
      traceId: crypto.randomUUID(),
      typeOfData: 'nomina',
      year: '2025'
    })
  }

  downloads = async (data) => {
    expect(data.link).toBe(
      'https://ayuntamientojarabacoa.gob.do/transparencia/wp-content/uploads/2026/01/nomina-correspondiente-al-mes-de-Diciembre-2025.pdf'
    )
    this.resolvers.downloads()
  }

  postDownloads = async (data) => {
    expect(await this.fileManagerClient.fileExists(data.urlDownload)).toBe(true)
    this.resolvers.postDownloads()
  }

  extractedTexts = async (data) => {
    expect(data.index).toBe(16)
    expect(await this.fileManagerClient.fileExists('Test/nomina/postDownloads/2025/diciembre/_.16.jpg')).toBe(true)
    this.resolvers.extractedTexts()
  }

  extractedTextAnalyzers = async (data) => {
    expect(data.index).toBe(16)
    expect(await this.fileManagerClient.fileExists('Test/nomina/extractedText/2025/diciembre/16.json')).toBe(true)
    this.resolvers.extractedTextAnalyzers()
  }

  aiTextAnalyzers = async (data) => {
    expect(await this.fileManagerClient.fileExists(data.extractedTextAnalyzerUrl)).toBe(true)
    this.resolvers.aiTextAnalyzers()
  }

  insertDatas = async (data) => {
    expect(await this.fileManagerClient.fileExists(data.aiTextAnalyzeUrl)).toBe(true)
    this.resolvers.insertDatas()
  }

  async waitForCompletion() {
    await Promise.all(Object.values(this.promises))
  }
}

describe('happyPath', () => {
  it('Happy path', async () => {
    const test = new EventBusTest()
    test.start()

    await test.waitForCompletion()

    console.log('🎉 Happy path finished')
    new Promise(res => setTimeout(res, 10_000))
  }, 60_000)
})
