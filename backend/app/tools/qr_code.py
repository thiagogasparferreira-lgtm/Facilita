import os
import uuid
import shutil
from typing import Dict, Any
from app.tools.base import BaseTool
from app.config import OUTPUT_DIR

class QrCodeTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "qr-code"

    @property
    def allowed_extensions(self) -> list:
        # Permite links ou uploads vazios para geração por texto
        return [".txt", ".png", ".jpg", ".jpeg"]

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        # Simula a geração gravando uma imagem mock do QR code no outputs
        unique_id = uuid.uuid4().hex
        output_filename = f"qrcode_{unique_id}.png"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # Como o QR code pode ser gerado a partir do texto do parâmetro,
        # vamos apenas gerar um arquivo ou copiar um mock simples
        # Escreve um arquivo de imagem dummy para simular o download
        with open(output_path, "wb") as f:
            # Escreve um binário de 1 pixel PNG para simulação ou similar
            # Para testes rápidos, criamos um arquivo vazio ou cópia simples
            f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82")
            
        return output_path
