import os
import uuid
from typing import Dict, Any
from PyPDF2 import PdfReader, PdfWriter
from app.tools.base import BaseTool
from app.config import OUTPUT_DIR

class PdfUnprotectTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "desproteger-pdf"

    @property
    def allowed_extensions(self) -> list:
        return [".pdf"]

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        if not file_path.lower().endswith(".pdf"):
            raise ValueError("O arquivo deve ser um PDF.")
            
        password = params.get("password", "") if params else ""
        
        unique_id = uuid.uuid4().hex
        output_filename = f"unprotected_{unique_id}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        reader = PdfReader(file_path)
        if reader.is_encrypted:
            try:
                reader.decrypt(password)
            except Exception:
                raise ValueError("Senha incorreta ou PDF não suportado.")
        
        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
            
        with open(output_path, "wb") as f_out:
            writer.write(f_out)
            
        return output_path
