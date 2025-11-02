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
    logging.info(json.dumps({
        "1": 1
    }))
    extractedTextUrl = fileManagerClient.generate_url(data,'extractedText',str(data.get('index')) + '.json' )
    logging.info(json.dumps({
        "2": 2
    }))
    if metadata.get('force') or not fileManagerClient.file_exists(extractedTextUrl):
        logging.info(json.dumps({
            "3": 3
        }))
        image_url = data.get("imageUrl")
        logging.info(json.dumps({
            "4": 4
        }))
        response = fileManagerClient.get_file(image_url)
        logging.info(json.dumps({
            "5": 5
        }))
        img = Image.open(BytesIO(response.content))
        logging.info(json.dumps({
            "6": 6
        }))
        filename = f"./{uuid.uuid4()}.png"  
        logging.info(json.dumps({
            "7": 7
        }))
        img.save(filename)
        logging.info(json.dumps({
            "8": 8
        }))
        result_json = ocr.predict(filename)

        ocr_data = result_json.get('res', {})

        rec_texts = ocr_data.get('rec_texts', [])
        rec_scores = ocr_data.get('rec_scores', [])
        rec_boxes = ocr_data.get('rec_boxes', [])

        text_regions = []

        for i, (text, score) in enumerate(zip(rec_texts, rec_scores)):
            clean_text = text.strip()

            box = rec_boxes[i]
            if len(box) >= 4:
                x1, y1, x2, y2 = box[:4]
                text_regions.append({
                    "text": clean_text,
                    "bbox": {
                        "x": int(x1),
                        "y": int(y1),
                        "width": int(x2 - x1),
                        "height": int(y2 - y1)
                    },
                    "confidence": round(float(score), 3)
                })

        fileManagerClient.create_text_file(extractedTextUrl, json.dumps(text_regions))
        os.remove(filename)

    bus.emit('analyzeExtractedTexts',{
        **data,
        "extractedTextUrl": extractedTextUrl,
    },metadata)

bus.on("extractedText", "extractedTexts", callback)
