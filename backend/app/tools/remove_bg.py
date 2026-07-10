import os
import uuid
from typing import Dict, Any
from app.tools.base import BaseTool
from app.config import OUTPUT_DIR

class RemoveBgTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "remover-fundo"

    @property
    def allowed_extensions(self) -> list:
        return [".png", ".jpg", ".jpeg", ".webp"]

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        # Gera imagem sem fundo simulada
        unique_id = uuid.uuid4().hex
        output_filename = f"nobg_{unique_id}.png"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # Copia o arquivo original ou gera um arquivo PNG simulado
        # Para simular o remove_bg, apenas criamos um arquivo PNG dummy
        with open(output_path, "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82")
            
        return output_path
