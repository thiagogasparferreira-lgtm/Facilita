import os
import uuid
from typing import Dict, Any
from PyPDF2 import PdfReader, PdfWriter
from app.tools.base import BaseTool
from app.config import OUTPUT_DIR

class PdfRotateTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "rotacionar-pdf"

    @property
    def allowed_extensions(self) -> list:
        return [".pdf"]

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        if not file_path.lower().endswith(".pdf"):
            raise ValueError("O arquivo deve ser um PDF.")
            
        degrees = int(params.get("degrees", 90)) if params else 90
        
        unique_id = uuid.uuid4().hex
        output_filename = f"rotated_{unique_id}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        reader = PdfReader(file_path)
        writer = PdfWriter()
        
        for page in reader.pages:
            page.rotate(degrees)
            writer.add_page(page)
            
        with open(output_path, "wb") as f_out:
            writer.write(f_out)
            
        return output_path
