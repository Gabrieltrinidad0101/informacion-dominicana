import boto3
import json
import os
from botocore.exceptions import ClientError


class FileManagerClient:
    def __init__(self):
        self.s3 = boto3.client(
            "s3",
            endpoint_url=os.getenv("ENDPOINT", "http://minio:9000"),
            aws_access_key_id=os.getenv("MINIO_ROOT_USER", "MINIO_ROOT_USER"),
            aws_secret_access_key=os.getenv("MINIO_ROOT_PASSWORD", "MINIO_ROOT_PASSWORD"),
            region_name=os.getenv("REGION", "us-east-1"),
        )
        self.bucket = "informacion-dominicana-v2"

    def list_files(self, prefix: str) -> list[str]:
        keys = []
        kwargs = {"Bucket": self.bucket, "Prefix": prefix}
        while True:
            resp = self.s3.list_objects_v2(**kwargs)
            for obj in resp.get("Contents", []):
                keys.append(obj["Key"])
            if resp.get("IsTruncated"):
                kwargs["ContinuationToken"] = resp["NextContinuationToken"]
            else:
                break
        return keys

    def file_exists(self, key: str) -> bool:
        try:
            self.s3.head_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                return False
            raise

    def get_file_bytes(self, key: str) -> bytes:
        resp = self.s3.get_object(Bucket=self.bucket, Key=key)
        return resp["Body"].read()

    def get_file_json(self, key: str) -> dict:
        data = self.get_file_bytes(key)
        return json.loads(data.decode("utf-8"))

    def upload_bytes(self, key: str, data: bytes, content_type: str = "application/octet-stream"):
        self.s3.put_object(Bucket=self.bucket, Key=key, Body=data, ContentType=content_type)

    # ── path helpers ──────────────────────────────────────────────────────────

    @staticmethod
    def parse_path_meta(key: str) -> dict:
        """
        Expects: InstitutionName/typeOfData/microService/year/month/filename
        The key may have a leading '/'.
        """
        clean = key.lstrip("/")
        parts = clean.split("/")
        return {
            "institutionName": parts[0],
            "typeOfData": parts[1],
            "microService": parts[2],
            "year": parts[3],
            "month": parts[4],
            "filename": parts[5] if len(parts) > 5 else "",
        }

    @staticmethod
    def ai_key_to_pdf_key(ai_key: str) -> str:
        """
        /InstitutionName/nomina/aiProcess/2024/enero/file_page0.json
        → InstitutionName/nomina/download/2024/enero/file.pdf
        """
        import re
        key = ai_key.lstrip("/")
        key = key.replace("/aiProcess/", "/download/")
        # Remove _pageN suffix before extension
        key = re.sub(r"_page\d+\.json$", ".pdf", key)
        # Also handle case without _pageN
        key = re.sub(r"\.json$", ".pdf", key)
        return key

    @staticmethod
    def ai_key_to_pii_image_key(ai_key: str) -> str:
        """
        /InstitutionName/nomina/aiProcess/2024/enero/file_page0.json
        → InstitutionName/nomina/pii/2024/enero/file_page0.png
        """
        key = ai_key.lstrip("/")
        key = key.replace("/aiProcess/", "/pii/")
        key = key.replace(".json", ".png")
        return key

    @staticmethod
    def ai_key_to_pii_pdf_key(ai_key: str) -> str:
        """
        /InstitutionName/nomina/aiProcess/2024/enero/file_page0.json
        → InstitutionName/nomina/pii/2024/enero/file_page0_corrected.pdf

        Only generated when the source page had a non-zero rotation.
        """
        key = ai_key.lstrip("/")
        key = key.replace("/aiProcess/", "/pii/")
        key = key.replace(".json", "_corrected.pdf")
        return key

    @staticmethod
    def ai_key_to_pii_month_pdf_key(ai_key: str) -> str:
        """
        /InstitutionName/nomina/aiProcess/2024/enero/file_page0.json
        → InstitutionName/nomina/pii/2024/enero/nomina.pdf

        One PDF per month accumulating all corrected pages.
        """
        key = ai_key.lstrip("/")
        parts = key.split("/")
        return f"{parts[0]}/{parts[1]}/pii/{parts[3]}/{parts[4]}/nomina.pdf"

    @staticmethod
    def extract_page_index(ai_key: str) -> int:
        """Extract page index from filename like file_page3.json → 3."""
        import re
        m = re.search(r"_page(\d+)\.json$", ai_key)
        return int(m.group(1)) if m else 0
