import os
import uuid
from typing import Dict, Any
from PyPDF2 import PdfReader, PdfWriter
from app.tools.base import BaseTool
from app.config import OUTPUT_DIR

class PdfProtectTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "proteger-pdf"

    @property
    def allowed_extensions(self) -> list:
        return [".pdf"]

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        # ✅ Validação de senha PRIMEIRO — antes de qualquer acesso a file_path
        # Garante HTTP 400 mesmo quando nenhum arquivo é enviado
        password = (params or {}).get("password", "").strip()
        if not password:
            raise ValueError("Uma senha é obrigatória para proteger o PDF. Por favor, informe uma senha.")
        if len(password) < 4:
            raise ValueError("A senha deve ter pelo menos 4 caracteres.")

        if not file_path or not file_path.lower().endswith(".pdf"):
            raise ValueError("O arquivo deve ser um PDF válido.")
        
        unique_id = uuid.uuid4().hex
        output_filename = f"protected_{unique_id}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        reader = PdfReader(file_path)
        writer = PdfWriter()
        
        for page in reader.pages:
            writer.add_page(page)
            
        writer.encrypt(password)
        
        with open(output_path, "wb") as f_out:
            writer.write(f_out)
            
        return output_path
