import os
from pathlib import Path

# Caminho base do projeto
BASE_DIR = Path(__file__).resolve().parent

# Configurações de armazenamento (Storage)
STORAGE_DIR = BASE_DIR / "storage"
UPLOAD_DIR = STORAGE_DIR / "uploads"
OUTPUT_DIR = STORAGE_DIR / "outputs"
TEMP_DIR = STORAGE_DIR / "temp"

# Assegura a criação dos diretórios
for path in [UPLOAD_DIR, OUTPUT_DIR, TEMP_DIR]:
    path.mkdir(parents=True, exist_ok=True)

# Configurações de limites de arquivos (em bytes)
LIMITS_FILE_SIZE = {
    "FREE": 10 * 1024 * 1024,   # 10 MB
    "PRO": 100 * 1024 * 1024,   # 100 MB
}

# Configurações de Rate Limit (por IP e E-mail de usuário)
# Permite ex: 30 requisições por minuto para FREE
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS_FREE = 60
RATE_LIMIT_MAX_REQUESTS_PRO = 120

# API Keys — carregadas de variável de ambiente para evitar hardcoding de segredos
# Formato esperado: JSON string com {"key": {"user_email": "...", "plan": "PRO"}}
import json as _cfg_json
_mock_keys_raw = os.environ.get("MOCK_API_KEYS_JSON", "{}")
try:
    MOCK_API_KEYS = _cfg_json.loads(_mock_keys_raw)
except Exception:
    MOCK_API_KEYS = {}

# Versão do sistema
APP_VERSION = "1.0.6"
