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
        #if metadata.get('force') or not self.fileManagerClient.file_exists(piiUrl):
        if True:
            pdfPath = self.fileManagerClient.download_file(data.get('urlDownload'))
            extractedTextAnalyzer = self.fileManagerClient.generate_url(data, 'extractedTextAnalyzer', str(data.get('index')) + '.json')
            bytes = self.fileManagerClient.get_file_bytes(extractedTextAnalyzer)
            wordsText = bytes.decode('utf-8')
            words = json.loads(wordsText)
            ID_REGEX = re.compile(r'^(\d{3}-\d{7}-\d{1}|\d{11})$')
            doc = fitz.open(pdfPath)
            page = doc[data['index'] - 1]
            for word in words['lines']:
                text = word['text']
                if not bool(ID_REGEX.match(text)):
                    continue

                x = float(word['x']) - 20
                y = float(word['y']) + 30
                w = float(word['width'])
                h = float(word['height'])

                rect = fitz.Rect(
                    x,
                    y,
                    w + x,
                    h + y
                )

                page.draw_rect(rect, color=(1, 0, 0), width=1)
                page.add_redact_annot(
                    rect,
                    fill=(0, 0, 0)
                )

            page.apply_redactions()
            pdfpII = f'./{uuid.uuid4()}.pdf'
            doc.save(pdfpII)
            doc.close()
            self.fileManagerClient.upload_file(pdfpII, piiUrl)   
            # delete file