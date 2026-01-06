import fitz  # PyMuPDF
import json
import re
import os
class PII():
    def __init__(self, eventBus, fileManagerClient):
        self.eventBus = eventBus
        self.fileManagerClient = fileManagerClient
        self.eventBus.on('analyzeExtractedTextPII', 'analyzeExtractedTexts', self.pii)

    def pii(self, data, metadata):
        piiUrl = self.fileManagerClient.generate_url(data, 'pii', str(data.get('index')) + '.json')
        if metadata.get('force') or not self.fileManagerClient.file_exists(piiUrl):
            self.fileManagerClient.download_file(data.get('urlDownload'))
            analyzeExtractedText = self.fileManagerClient.generate_url(data, 'analyzeExtractedText', str(data.get('index')) + '.json')
            bytes = self.fileManagerClient.get_file_bytes(analyzeExtractedText)
            wordsText = bytes.decode('utf-8')
            words = json.loads(wordsText)
            ID_REGEX = re.compile(r'^(\d{3}-\d{7}-\d{1}|\d{11})$')
            for word in words:
                text = word['text']
                if not bool(ID_REGEX.match(text)):
                    continue
                doc = fitz.open(f'./downloads/${analyzeExtractedText}')
                page = doc[0]
                rect = fitz.Rect(float(word['x']),float(word['y']),float(word['width']), float(word['height']))
                page.add_redact_annot(
                    rect,
                    fill=(0, 0, 0) 
                )
                page.apply_redactions()
                doc.save(f"{analyzeExtractedText}.pdf")
                doc.close()
                self.fileManagerClient.upload_file(f"{analyzeExtractedText}.pdf", piiUrl)   
                # delete file
                os.remove(f"{analyzeExtractedText}.pdf")

        self.eventBus.emit('aiTextAnalyzers', {
            **data,
            "piiUrl": piiUrl
        }, metadata)
