from io import BytesIO
import requests
from PIL import Image
from paddleocr import PaddleOCR
from eventBus import EventBus
from fileManagerClient import FileManagerClient
import json

fileManagerClient = FileManagerClient()
bus = EventBus(queue_name="extractedText", exchange_name="extractedTexts")
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
    fileManagerClient.createTextFile(extractedTextUrl, json.dumps(output_data))
    bus.emit('analyzeExtractedTexts',{
        **data,
        extractedTextUrl: extractedTextUrl,
    },metadata)

bus.on("extractedText", "extractedTexts", callback)
