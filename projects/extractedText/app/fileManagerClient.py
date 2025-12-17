import boto3
from botocore.exceptions import ClientError
from pathlib import Path
import requests
import os

class FileManagerClient:
    def __init__(
        self,
        bucket_name="informacion-dominicana",
        endpoint_url="http://minio:9000",
        region="us-east-1",
        access_key="MINIO_ROOT_USER",
        secret_key="MINIO_ROOT_PASSWORD",
    ):
        print(os.getenv("REGION", region))
        print(os.getenv("MINIO_ROOT_USER", access_key))
        print(os.getenv("MINIO_ROOT_PASSWORD", secret_key))
        
        self.endpoint_url = endpoint_url
        self.region = os.getenv("REGION", region)
        self.access_key = os.getenv("MINIO_ROOT_USER", access_key)
        self.secret_key = os.getenv("MINIO_ROOT_PASSWORD", secret_key)
        self.bucket = bucket_name

        self.s3 = boto3.client(
            "s3",
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            region_name=self.region,
        )


    # -------------------------
    # Path generator (igual al tuyo)
    # -------------------------
    def generate_url(self, data, micro_service, file_name):
        return (
            f"{data['institutionName']}/"
            f"{data['typeOfData']}/"
            f"{micro_service}/"
            f"{data['year']}/"
            f"{data['month']}/"
            f"{file_name}"
        )

    # -------------------------
    # Upload local file
    # -------------------------
    def upload_file(self, local_file_path, s3_key):
        self.s3.upload_file(
            Filename=local_file_path,
            Bucket=self.bucket,
            Key=s3_key
        )
        return {"bucket": self.bucket, "key": s3_key}

    # -------------------------
    # Upload file from URL
    # -------------------------
    def upload_file_from_url(self, url, s3_key):
        response = requests.get(url, stream=True)
        response.raise_for_status()

        self.s3.upload_fileobj(
            Fileobj=response.raw,
            Bucket=self.bucket,
            Key=s3_key
        )

        return {"bucket": self.bucket, "key": s3_key}

    # -------------------------
    # Create text file
    # -------------------------
    def create_text_file(self, s3_key, file_text):
        self.s3.put_object(
            Bucket=self.bucket,
            Key=s3_key,
            Body=file_text.encode("utf-8"),
            ContentType="text/plain"
        )
        return {"bucket": self.bucket, "key": s3_key}

    # -------------------------
    # Exists
    # -------------------------
    def file_exists(self, s3_key) -> bool:
        try:
            self.s3.head_object(Bucket=self.bucket, Key=s3_key)
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                return False
            raise

    # -------------------------
    # Get file (bytes)
    # -------------------------
    def get_file_bytes(self, s3_key) -> bytes:
        response = self.s3.get_object(
            Bucket=self.bucket,
            Key=s3_key
        )
        return response["Body"].read()

    # -------------------------
    # Download to disk
    # -------------------------
    def download_file(self, s3_key, download_dir="downloads"):
        file_path = Path(download_dir) / s3_key
        file_path.parent.mkdir(parents=True, exist_ok=True)

        self.s3.download_file(
            Bucket=self.bucket,
            Key=s3_key,
            Filename=str(file_path)
        )

        return str(file_path)
