from PIL import Image, ImageDraw
import re
import uuid
import os
import shutil
import fitz

class PII:
    def __init__(self, eventBus, fileManagerClient):
        self.eventBus = eventBus
        self.fileManagerClient = fileManagerClient

        self.eventBus.on(
            'extractedTextAnalyzerPII',
            'extractedTextAnalyzers',
            self.pii
        )

    def pii(self, data, metadata):
        original_pdf_path = self.fileManagerClient.download_file(
            data['urlDownload']
        )

        pii_pdf_url = self.fileManagerClient.generate_url(
            data,
            'pii',
            'document.pdf'
        )

        try:
            pii_pdf_path = self.fileManagerClient.download_file(pii_pdf_url)
        except Exception as e:
            pii_pdf_path = f'./downloads/{pii_pdf_url}'
            
        if not os.path.exists(pii_pdf_path):
            shutil.copyfile(original_pdf_path, pii_pdf_path)

        extracted_text_type = data['extractedTextType']

        if extracted_text_type == 'PaddleOCR':
            img_without_pii = self.piiImage(data, metadata)
            self.replace_images_in_pdf(
                input_pdf=pii_pdf_path,
                output_pdf=pii_pdf_path,
                new_image_path=img_without_pii,
                page_number=data['page'],
                image_index=data['imageIndex']
            )

            os.remove(img_without_pii)

        elif extracted_text_type == 'Text':
            self.piiText(
                pdf_path=pii_pdf_path,
                data=data,
                metadata=metadata
            )

        self.fileManagerClient.upload_file(
            pii_pdf_path,
            pii_pdf_url
        )

    def piiText(self, pdf_path, data, metadata):
        ID_REGEX = re.compile(r'\b(\d{3}-\d{7}-\d{1}|\d{11})\b')

        doc = fitz.open(pdf_path)
        page = doc[data['page']]

        text_instances = page.search_for(ID_REGEX.pattern)

        for rect in text_instances:
            page.add_redact_annot(rect, fill=(0, 0, 0))

        page.apply_redactions()
        doc.save(pdf_path)
        doc.close()

    def piiImage(self, data, metadata):
        index = str(data.get('imageIndex'))

        imgProcessedUrl = self.fileManagerClient.generate_url(
            data, 'imgProcessed', f"page_{data.get('page')}_img_{index}.png"
        )
        
        imgPath = self.fileManagerClient.download_file(imgProcessedUrl)

        extractedTextAnalyzer = self.fileManagerClient.generate_url(
            data, 'extractedTextAnalyzer', f"page_{data.get('page')}_img_{index}.json"
        )
        

        words = self.fileManagerClient.get_file_json(extractedTextAnalyzer)

        ID_REGEX = re.compile(r'^(\d{3}-\d{7}-\d{1}|\d{11})$')
        img = Image.open(imgPath).convert("RGB")
        draw = ImageDraw.Draw(img)

        for word in words['lines']:
            if not ID_REGEX.match(word['text']):
                continue

            x = int(float(word['x']))
            y = int(float(word['y']))
            w = int(float(word['width']))
            h = int(float(word['height']))

            draw.rectangle(
                [(x, y), (x + w, y + h)],
                fill="black"
            )

        outImg = f'./{uuid.uuid4()}.png'
        
        img.save(outImg)
        os.remove(imgPath)

        return outImg

    def replace_images_in_pdf(
        self,
        input_pdf: str,
        output_pdf: str,
        new_image_path: str,
        page_number: int = 0,
        image_index: int = 0,
    ):
        doc = fitz.open(input_pdf)
        page = doc[page_number]

        image_list = page.get_images(full=True)

        if image_index >= len(image_list):
            doc.close()
            raise IndexError("Invalid image_index")

        xref = image_list[image_index][0]
        rects = page.get_image_rects(xref)

        for rect in rects:
            page.draw_rect(
                rect,
                color=(1, 1, 1),
                fill=(1, 1, 1)
            )

            page.insert_image(
                rect,
                filename=new_image_path,
                keep_proportion=True
            )

        doc.save(output_pdf, 
                 incremental=True,
                encryption=fitz.PDF_ENCRYPT_KEEP)
        doc.close()
