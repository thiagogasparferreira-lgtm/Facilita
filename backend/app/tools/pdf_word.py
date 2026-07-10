import os
import uuid
from typing import Dict, Any
from app.tools.base import BaseTool
from app.config import OUTPUT_DIR


class PdfWordTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "pdf-word"

    @property
    def allowed_extensions(self) -> list:
        return [".pdf"]

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        unique_id = uuid.uuid4().hex
        output_filename = f"converted_{unique_id}.docx"
        output_path = os.path.join(OUTPUT_DIR, output_filename)

        try:
            from pdf2docx import Converter
            # Inicializa o conversor avançado de layout e imagens
            cv = Converter(file_path)
            cv.convert(output_path, start=0, end=None)
            cv.close()
            
            # Valida a integridade do arquivo gerado
            if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
                raise Exception("Falha na geração do arquivo do Word convertido.")
                
            return output_path
        except Exception as e:
            if os.path.exists(output_path):
                os.remove(output_path)
            raise e
