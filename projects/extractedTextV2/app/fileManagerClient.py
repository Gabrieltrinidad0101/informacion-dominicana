import requests
from pathlib import Path

class FileManagerClient:
    def __init__(self, base_url="http://filesManager:4000"):
        self.base_url = base_url

    def upload_file(self, local_file_path, folder_path):
        with open(local_file_path, "rb") as f:
            files = {"file": f}
            data = {"folderPath": folder_path}
            response = requests.post(f"{self.base_url}/upload", files=files, data=data)
        response.raise_for_status()
        return response.json()

    def upload_file_from_url(self, url, folder_path):
        payload = {"url": url, "folderPath": folder_path}
        headers = {"Content-Type": "application/json"}
        response = requests.post(f"{self.base_url}/upload-file-from-url", json=payload, headers=headers)
        response.raise_for_status()
        return response.json()

    def create_text_file(self, folder_path, file_text):
        payload = {"folderPath": folder_path, "fileText": file_text}
        headers = {"Content-Type": "application/json"}
        response = requests.post(f"{self.base_url}/create-file", json=payload, headers=headers)
        response.raise_for_status()
        return response.json()

    def file_exists(self, file_path):
        response = requests.get(f"{self.base_url}/file-exists", params={"filePath": file_path})
        response.raise_for_status()
        return response.json().get("exists", False)

    def get_file(self, file_url):
        response = requests.get(f"{self.base_url}/{file_url}")
        response.raise_for_status()
        return response.content

    def get_file_bytes(self, file_url):
        response = requests.get(f"{self.base_url}/{file_url}", stream=True)
        response.raise_for_status()
        return response.content

    def generate_url(self, data, micro_service, file_name):
        return f"{data['institutionName']}/{data['typeOfData']}/{micro_service}/{data['year']}/{data['month']}/{file_name}"

    def get_file_buffer(self, file_url):
        try:
            response = requests.get(f"{self.base_url}/data/{file_url}", stream=True)
            response.raise_for_status()
            return response.content
        except requests.RequestException:
            return None

    def download_file(self, url):
        file_path = Path("downloads") / url
        file_path.parent.mkdir(parents=True, exist_ok=True)

        response = requests.get(f"{self.base_url}/data/{url}", stream=True)
        response.raise_for_status()

        with open(file_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

        return str(file_path)
