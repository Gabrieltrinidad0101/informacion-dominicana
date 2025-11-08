from io import BytesIO
from PIL import Image
from paddleocr import PaddleOCR
from eventBus import EventBus
from fileManagerClient import FileManagerClient
import json
import uuid
import os
import logging

fileManagerClient = FileManagerClient()
bus = EventBus(queue_name="extractedText", exchange_name="extractedTexts")
ocr = PaddleOCR(
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False
)

def callback(data, metadata):
    extractedTextUrl = fileManagerClient.generate_url(data,'extractedText',str(data.get('index')) + '.json' )
    if metadata.get('force') or not fileManagerClient.file_exists(extractedTextUrl):
        image_url = data.get("imageUrl")
        response = fileManagerClient.get_file(image_url)
        img = Image.open(BytesIO(response.content))
        filename = f"./{uuid.uuid4()}.png"  
        img.save(filename)  
        result_json = ocr.predict(filename)
        fileManagerClient.create_text_file(extractedTextUrl, json.dumps({"res": result_json.get("res")}, default=str))
        os.remove(filename)

    bus.emit('analyzeExtractedTexts',{
        **data,
        "extractedTextUrl": extractedTextUrl,
        "extractedTextType": "PaddleOCR"
    },metadata)

bus.on("extractedText", "extractedTexts", callback)
