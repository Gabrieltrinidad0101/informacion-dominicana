from io import BytesIO
from PIL import Image
from paddleocr import PaddleOCR
from eventBus import EventBus
from fileManagerClient import FileManagerClient
import uuid
import os
import shutil
import math
import json

def calculate_rotated_dimensions(width, height, angle_degrees):
    angle_rad = math.radians(angle_degrees)
    
    cos_theta = abs(math.cos(angle_rad))
    sin_theta = abs(math.sin(angle_rad))
    
    new_width = width * cos_theta + height * sin_theta
    new_height = width * sin_theta + height * cos_theta
    
    return (new_width, new_height)

fileManagerClient = FileManagerClient()
bus = EventBus(queue_name="extractedText", exchange_name="extractedTexts")
ocr = PaddleOCR(
    use_textline_orientation=True,
    use_doc_orientation_classify=True,
    use_doc_unwarping=True,
    lang="es"
)

def callback(data, metadata):
    extractedTextUrl = fileManagerClient.generate_url(data,'extractedText',f"page_{data.get('page')}_img_{data.get('imageIndex')}.json")
    imgProcessedUrl = fileManagerClient.generate_url(data,'imgProcessed',f"page_{data.get('page')}_img_{data.get('imageIndex')}.png")
    
    if metadata.get('force') or not fileManagerClient.file_exists(extractedTextUrl) or not fileManagerClient.file_exists(imgProcessedUrl):
        image_url = data.get("imageUrl")
        response = fileManagerClient.get_file_bytes(image_url)
        img = Image.open(BytesIO(response))
        uuid_ = str(uuid.uuid4())
        filename = f"./{uuid_}.png"
        img.save(filename)  
        
        result = ocr.predict(filename)
        outfile = "output"
        for res in result:
            res.save_to_img(outfile)
            res.save_to_json(outfile)
        
        result_json = ""
        result_json_path = f"{outfile}/{uuid_}_res.json"
        with open(result_json_path, "r") as f:
            result_json = f.read()
        
        
        originalImage = Image.open(filename)
        imgPreProcessed = Image.open(f"{outfile}/{uuid_}_preprocessed_img.png")
        width, height = originalImage.size  
        
        result_obj = json.loads(result_json)
        angle = (result_obj or {}).get('doc_preprocessor_res', {}).get('angle') or 0
        
        new_width, new_height = calculate_rotated_dimensions(width, height, angle)
        
        print({
            "width": width,
            "height": height,
            "angle": angle,
            "new_width": new_width,
            "new_height": new_height
        })
        
        corrected_img = imgPreProcessed.crop((
            width,                          
            0,           
            width + new_width,              
            new_height                       
        ))

        imgPath = f"{outfile}/{uuid_}_preprocessed_img_upload.png"
        corrected_img.save(imgPath)
        
        fileManagerClient.create_text_file(extractedTextUrl, result_json)
        fileManagerClient.upload_file(imgPath, imgProcessedUrl)
        
        
        
        

    bus.emit('extractedTextAnalyzers',{
        **data,
        "extractedTextUrl": extractedTextUrl,
        "extractedTextType": "PaddleOCR"
    },metadata)

bus.on("extractedText", "extractedTexts", callback)
print("\n\n\n\nExtractedText Started\n\n\n\n")