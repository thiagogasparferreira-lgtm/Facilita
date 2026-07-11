import os
import secrets
import warnings
from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext

# SECRET_KEY deve ser definida como variável de ambiente em produção.
# Se não estiver definida, gera uma chave aleatória (inválida entre restarts) e emite aviso.
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    SECRET_KEY = secrets.token_hex(32)
    warnings.warn(
        "[SEGURANÇA] SECRET_KEY não definida como variável de ambiente! "
        "Usando chave gerada em runtime — tokens serão invalidados a cada restart. "
        "Defina SECRET_KEY no painel do Render.",
        RuntimeWarning
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 dias

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
