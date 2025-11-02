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

        ocr_data = result_json.get('res', {})

        rec_texts = ocr_data.get('rec_texts', [])
        rec_scores = ocr_data.get('rec_scores', [])
        rec_boxes = ocr_data.get('rec_boxes', [])
        angle = ocr_data.get('doc_preprocessor_res', {}).get('angle', 0)

        if angle == -1:
            angle = 0

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

        fileManagerClient.create_text_file(extractedTextUrl, json.dumps({"lines": text_regions, "angle": angle}))
        os.remove(filename)

    bus.emit('aiTextAnalyzers',{
        **data,
        "extractedTextUrl": extractedTextUrl,
    },metadata)

bus.on("extractedText", "extractedTexts", callback)
