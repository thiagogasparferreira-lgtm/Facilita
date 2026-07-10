import os
import uuid
from typing import Dict, Any
from PyPDF2 import PdfWriter
from app.tools.base import BaseTool
from app.config import OUTPUT_DIR

class PdfMergeTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "juntar-pdf"

    @property
    def allowed_extensions(self) -> list:
        return [".pdf"]

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        if not file_path.lower().endswith(".pdf"):
            raise ValueError("O arquivo deve ser um PDF.")
            
        unique_id = uuid.uuid4().hex
        output_filename = f"merged_{unique_id}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        merger = PdfWriter()
        # Junta o arquivo com ele mesmo para simulação no motor de arquivo único
        merger.append(file_path)
        merger.append(file_path)
        
        with open(output_path, "wb") as f_out:
            merger.write(f_out)
            
        return output_path
