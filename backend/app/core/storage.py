import os
import boto3
from pathlib import Path
from typing import Optional
from app.config import STORAGE_DIR

# Configurações do S3 via variáveis de ambiente
S3_BUCKET = os.environ.get("S3_BUCKET_NAME")
S3_ENDPOINT_URL = os.environ.get("S3_ENDPOINT_URL")  # Útil para Cloudflare R2, MinIO, etc.
S3_ACCESS_KEY = os.environ.get("S3_ACCESS_KEY_ID")
S3_SECRET_KEY = os.environ.get("S3_SECRET_ACCESS_KEY")
S3_REGION = os.environ.get("S3_REGION", "us-east-1")

# Habilita o S3 apenas se o Bucket estiver configurado
USE_S3 = bool(S3_BUCKET and S3_ACCESS_KEY and S3_SECRET_KEY)

s3_client = None
if USE_S3:
    s3_client = boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT_URL,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        region_name=S3_REGION
    )

def upload_file(file_path: str, destination_name: str, folder: str = "uploads") -> str:
    """
    Faz o upload do arquivo para o S3 ou mantém no disco local.
    Retorna a chave do S3 ou o caminho local.
    """
    if USE_S3:
        s3_key = f"{folder}/{destination_name}"
        s3_client.upload_file(file_path, S3_BUCKET, s3_key)
        return s3_key
    
    # Fallback local (Dev)
    dest_path = STORAGE_DIR / folder / destination_name
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    if str(dest_path) != file_path:
        import shutil
        shutil.copy2(file_path, dest_path)
    return str(dest_path)

def download_file(source_key: str, destination_path: str) -> str:
    """
    Baixa um arquivo do S3 para o disco local para ser processado,
    ou apenas retorna o caminho se já estiver local.
    """
    if USE_S3:
        s3_client.download_file(S3_BUCKET, source_key, destination_path)
        return destination_path
    
    # Fallback local
    return source_key

def generate_presigned_url(s3_key: str, expiration: int = 3600) -> Optional[str]:
    """
    Gera uma URL temporária de download direto do bucket.
    Se não usar S3, retorna None (o app usará o fallback de servir o arquivo via /downloads local).
    """
    if not USE_S3:
        return None
        
    url = s3_client.generate_presigned_url(
        ClientMethod='get_object',
        Params={'Bucket': S3_BUCKET, 'Key': s3_key},
        ExpiresIn=expiration
    )
    return url

def delete_file(s3_key: str):
    """Deleta um arquivo do storage."""
    if USE_S3:
        try:
            s3_client.delete_object(Bucket=S3_BUCKET, Key=s3_key)
        except Exception:
            pass
    else:
        try:
            if os.path.exists(s3_key):
                os.remove(s3_key)
        except Exception:
            pass
