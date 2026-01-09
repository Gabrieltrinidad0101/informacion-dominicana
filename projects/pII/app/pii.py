import fitz  # PyMuPDF
import json
import re
import os
import uuid
class PII():
    def __init__(self, eventBus, fileManagerClient):
        self.eventBus = eventBus
        self.fileManagerClient = fileManagerClient
        self.eventBus.on('extractedTextAnalyzerPII', 'extractedTextAnalyzers', self.pii)

    def pii(self, data, metadata):
        piiUrl = self.fileManagerClient.generate_url(data, 'pii', str(data.get('index')) + '.pdf')
        if metadata.get('force') or not self.fileManagerClient.file_exists(piiUrl):
            pdfPath = self.fileManagerClient.download_file(data.get('urlDownload'))
            extractedTextAnalyzer = self.fileManagerClient.generate_url(data, 'extractedTextAnalyzer', str(data.get('index')) + '.json')
            bytes = self.fileManagerClient.get_file_bytes(extractedTextAnalyzer)
            wordsText = bytes.decode('utf-8')
            words = json.loads(wordsText)
            ID_REGEX = re.compile(r'^(\d{3}-\d{7}-\d{1}|\d{11})$')
            doc = fitz.open(pdfPath)
            page = doc[0]
            for word in words['lines']:
                text = word['text']
                if not bool(ID_REGEX.match(text)):
                    continue
                x0 = float(word['x'])
                y0 = float(word['y'])
                x1 = float(word['width'])
                y1 = float(word['height'])

                porX = (x0 / 2000) * 100
                porY = (y0 / 2000) * 100
                porHeight = (x1 / 2000) * 100
                porWidth = (y1 / 2000) * 100

                positionX = page.rect.width * (porX / 100)
                positionY = page.rect.height * (porY / 100)
                width = page.rect.width * (porWidth / 100)
                height = page.rect.height * (porHeight / 100)

                rect = fitz.Rect(positionX, positionY, positionX + width, positionY + height)
                page.draw_rect(rect, color=(0, 0, 0), fill=(0, 0, 0))
                page.add_redact_annot(
                    rect,
                    fill=(0, 0, 0) 
                )
            page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_REMOVE)
            pdfpII = f'./{uuid.uuid4()}.pdf'
            doc.save(pdfpII)
            doc.close()
            self.fileManagerClient.upload_file(pdfpII, piiUrl)   
            # delete file