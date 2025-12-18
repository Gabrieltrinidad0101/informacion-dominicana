from io import BytesIO
from PIL import Image
from paddleocr import PaddleOCR
from eventBus import EventBus
from fileManagerClient import FileManagerClient
import uuid
import os
import shutil
import logging

logging.basicConfig(level=logging.INFO)

fileManagerClient = FileManagerClient()
bus = EventBus(queue_name="extractedText", exchange_name="extractedTexts")
ocr = PaddleOCR(
    use_textline_orientation=True,
    use_doc_orientation_classify=True,
    use_doc_unwarping=True,
    lang="es"
) 

def callback(data, metadata):
    logging.info("Events")
    extractedTextUrl = fileManagerClient.generate_url(data,'extractedText',str(data.get('index')) + '.json' )
    if metadata.get('force') or not fileManagerClient.file_exists(extractedTextUrl):
        image_url = data.get("imageUrl")
        response = fileManagerClient.get_file_bytes(image_url)
        img = Image.open(BytesIO(response))
        uuid_ = str(uuid.uuid4())
        filename = f"./{uuid_}.png"
        img.save(filename)  
        result = ocr.predict(filename)
        outfile = "./output" + uuid_
        for res in result:
            res.save_to_json(outfile)
        result_json = ""
        result_json_path = f"./{outfile}/{uuid_}_res.json"
        with open(result_json_path, "r") as f:
            result_json = f.read()

        fileManagerClient.create_text_file(extractedTextUrl, result_json)
        shutil.rmtree(outfile)
        os.remove(filename)

    bus.emit('analyzeExtractedTexts',{
        **data,
        "extractedTextUrl": extractedTextUrl,
        "extractedTextType": "PaddleOCR"
    },metadata)

bus.on("extractedText", "extractedTexts", callback)
logging.info("\n\n\n\nExtractedText Started\n\n\n\n")