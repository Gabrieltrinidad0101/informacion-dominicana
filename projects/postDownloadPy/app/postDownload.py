import fitz
import json

class PostDownload:
    CONTENT_TYPES = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp"
    }

    def __init__(self, event_bus, file_manager_client):
        self.event_bus = event_bus
        self.file_manager_client = file_manager_client
        self.event_bus.on('postDownload', 'postDownloads', self.postDownload)

    def postDownload(self, data, metadata):
        data.pop("_id", None)
        file_path = self.file_manager_client.download_file(data["urlDownload"])
        doc = fitz.open(file_path)
        for page_index, page in enumerate(doc):
            self.extract_text_from_pdf(data, metadata,page,page_index)
            self.extract_images_from_pdf(data, metadata,doc,page,page_index)
    
    def extract_images_from_pdf(self, data, metadata,doc,page,page_index):
        image_list = page.get_images(full=True)

        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)

            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            image_url = self.file_manager_client.generate_url(
                data,
                'postDownloads',
                f'page_{page_index}_img_{img_index}.{image_ext}'
            )
            
            images_meta_url = self.file_manager_client.generate_url(
                data, 'postDownloads', f'page_{page_index}_img_{img_index}.json'
            )
            
            image_exist = self.file_manager_client.file_exists(image_url)
            images_meta_exist = self.file_manager_client.file_exists(images_meta_url)
            if metadata.get('force') or not image_exist:
                self.file_manager_client.create_binary_file(
                    image_url,
                    image_bytes,
                    self.CONTENT_TYPES.get(image_ext, "application/octet-stream")
                )
            if metadata.get('force') or not images_meta_exist:
                rect = page.get_image_rects(xref)[0]
                self.file_manager_client.create_text_file(
                    images_meta_url,
                    json.dumps({
                        "page": page_index,
                        "image": {
                            "imageIndex": img_index,
                            "imageUrl": image_url,
                            "bbox": [rect.x0, rect.y0, rect.x1, rect.y1],
                            "width": rect.width,
                            "height": rect.height,
                            "pageWidth": page.rect.width,
                            "pageHeight": page.rect.height,
                        }
                    })
                )
            self.event_bus.emit(
                'extractedTexts',
                {
                    **data,
                    "page": page_index,
                    "imageUrl": image_url,
                    "imageIndex": img_index,
                    "imageMetaDataUrl": images_meta_url
                },
                metadata
            )

    def extract_text_from_pdf(self, data, metadata,page,page_index):
        extracted_text_url = self.file_manager_client.generate_url(data,'extractedText',str(page_index + 1) + '.json' )
        
        if metadata.get('force') or not self.file_manager_client.file_exists(extracted_text_url):
            lines = []
            blocks = page.get_text("dict")["blocks"]

            for block in blocks:
                if block["type"] != 0:
                    continue

                for line in block["lines"]:
                    for span in line["spans"]:
                        lines.append({
                            "text": span["text"],
                            "bbox": span["bbox"],
                            "font": span["font"],
                            "size": span["size"],
                        })
            if ("".join(line["text"] for line in lines)).strip() == "":
                return
            payload = json.dumps({
                "page": page_index,
                "pageAngle": page.rotation,
                "lines": lines
            })
            self.file_manager_client.create_text_file(extracted_text_url,payload)
        # self.event_bus.emit('extractedTextAnalyzers',{
        #     **data,
        #     "extractedTextUrl": extracted_text_url,
        #     "extractedTextType": "Text"
        # },metadata)

