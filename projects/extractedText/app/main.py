from io import BytesIO
from PIL import Image
from paddleocr import PaddleOCR
from eventBus import EventBus
from fileManagerClient import FileManagerClient
import uuid
import os
import shutil

fileManagerClient = FileManagerClient()
bus = EventBus(queue_name="extractedText", exchange_name="extractedTexts")
ocr = PaddleOCR(
    use_textline_orientation=True,
    use_doc_orientation_classify=True,
    use_doc_unwarping=True,
    lang="es"
) 

def callback(data, metadata):
    extractedTextUrl = fileManagerClient.generate_url(data,'extractedText',str(data.get('index')) + '.json' )
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
        imgPreProcessed = Image.open(f"{outfile}/{uuid_}_preprocessed_img.png")
        width, height = imgPreProcessed.size  
        segment = width // 3
        last_img = imgPreProcessed.crop((
            segment * 2,  
            0,            
            width,        
            height
        ))

        imgPath = f"{outfile}/{uuid_}_preprocessed_img_upload.png"
        last_img.save(imgPath)
        
        fileManagerClient.create_text_file(extractedTextUrl, result_json)
        fileManagerClient.upload_file(imgPath, imgProcessedUrl)
        shutil.rmtree(outfile)
        os.remove(filename)
    
    bus.emit('extractedTextAnalyzers',{
        **data,
        "extractedTextUrl": extractedTextUrl,
        "extractedTextType": "PaddleOCR"
    },metadata)

bus.on("extractedText", "extractedTexts", callback)
print("\n\n\n\nExtractedText Started\n\n\n\n")