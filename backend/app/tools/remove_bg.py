import os
import uuid
from typing import Dict, Any
from PIL import Image
from rembg import remove, new_session
from app.tools.base import BaseTool
from app.config import OUTPUT_DIR

# Sessão global para reutilização do modelo de remoção
_rembg_session = None

def get_rembg_session():
    global _rembg_session
    if _rembg_session is None:
        # Inicializa com o modelo leve "u2netp" (~4MB) para economizar RAM no Render Free tier
        _rembg_session = new_session("u2netp")
    return _rembg_session

class RemoveBgTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "remover-fundo"

    @property
    def allowed_extensions(self) -> list:
        return [".png", ".jpg", ".jpeg", ".webp"]

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        # Carrega a imagem original
        input_image = Image.open(file_path)
        
        # Executa o algoritmo rembg de IA com o modelo leve
        session = get_rembg_session()
        output_image = remove(input_image, session=session)
        
        # Cria nome de saída em formato PNG para manter transparência do canal alpha
        unique_id = uuid.uuid4().hex
        output_filename = f"nobg_{unique_id}.png"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # Salva o arquivo final
        output_image.save(output_path, "PNG")
        
        return output_path
