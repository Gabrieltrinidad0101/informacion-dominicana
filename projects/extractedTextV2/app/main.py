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
        uuid = str(uuid.uuid4())
        filename = f"./{uuid}.png"
        img.save(filename)  
        result = ocr.predict(filename)
        outfile = "output" + uuid
        result.save_to_json(outfile)
        result_json = ""
        with open(outfile, "r") as f:
            result_json = f

        fileManagerClient.create_text_file(extractedTextUrl, result_json)
        os.remove(filename)
        os.remove(outfile)

    bus.emit('analyzeExtractedTexts',{
        **data,
        "extractedTextUrl": extractedTextUrl,
        "extractedTextType": "PaddleOCR"
    },metadata)

bus.on("extractedText", "extractedTexts", callback)
print("\n\n\n\nExtractedText Started\n\n\n\n")