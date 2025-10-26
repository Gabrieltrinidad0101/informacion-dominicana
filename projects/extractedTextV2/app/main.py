from io import BytesIO
import requests
from PIL import Image
from paddleocr import PaddleOCR
from eventBus import EventBus, logs
import os
from fileManagerClient import FileManagerClient

fileManagerClient = FileManagerClient()
bus = EventBus(queue_name="my_queue", exchange_name="my_exchange")
ocr = PaddleOCR(
    use_doc_orientation_classify=False, 
    use_doc_unwarping=False, 
    use_textline_orientation=False
)

def callback(data, metadata):
    extractedTextUrl = fileManagerClient.generateUrl(data,'extractedText',data.index + '.json' )
    if fileManagerClient.fileExists(extractedTextUrl):
        image_url = data.get("image_url")
        response = requests.get(image_url)
        response.raise_for_status()
        img = Image.open(BytesIO(response.content))

        result = ocr.ocr(img)

        output_data = []
        for line in result[0]: 
            text, confidence, box = line[1][0], line[1][1], line[0]
            output_data.append({
                "text": text,
                "confidence": confidence,
                "box": box
            })
        fileManagerClient.
        resp = requests.post(TARGET_SERVER_URL, json=output_data, timeout=10)
        resp.raise_for_status()

    bus.emit('analyzeExtractedTexts',{
        **data,
        extractedTextUrl: extractedTextUrl,
    },metadata)

bus.on("my_queue", "my_exchange", callback)
