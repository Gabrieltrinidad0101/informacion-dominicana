from PIL import Image, ImageDraw
import json
import re
import uuid
import os

class PII():
    def __init__(self, eventBus, fileManagerClient):
        self.eventBus = eventBus
        self.fileManagerClient = fileManagerClient
        self.eventBus.on(
            'extractedTextAnalyzerPII',
            'extractedTextAnalyzers',
            self.pii
        )

    def pii(self, data, metadata):

        index = str(data.get('index'))

        imgProcessedUrl = self.fileManagerClient.generate_url(
            data,
            'imgProcessed',
            f'{index}.png'
        )
        imgPath = self.fileManagerClient.download_file(imgProcessedUrl)

        extractedTextAnalyzer = self.fileManagerClient.generate_url(
            data,
            'extractedTextAnalyzer',
            f'{index}.json'
        )

        words = json.loads(
            self.fileManagerClient
                .get_file_bytes(extractedTextAnalyzer)
                .decode('utf-8')
        )

        ID_REGEX = re.compile(r'^(\d{3}-\d{7}-\d{1}|\d{11})$')

        img = Image.open(imgPath).convert("RGB")
        draw = ImageDraw.Draw(img)

        for word in words['lines']:
            text = word['text']
            if not ID_REGEX.match(text):
                continue

            x = int(float(word['x']))
            y = int(float(word['y']))
            w = int(float(word['width']))
            h = int(float(word['height']))

            draw.rectangle(
                [(x, y), (x + w, y + h)],
                fill="black"
            )

        outImg = f'./{uuid.uuid4()}.png'
        img.save(outImg)

        imgPIIUrl = self.fileManagerClient.generate_url(
            data,
            'imgPII',
            f'{index}.png'
        )
        self.fileManagerClient.upload_file(outImg, imgPIIUrl)

        os.remove(outImg)
