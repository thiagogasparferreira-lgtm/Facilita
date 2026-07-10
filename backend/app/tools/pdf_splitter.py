import os
import uuid
from PyPDF2 import PdfReader, PdfWriter
from typing import Dict, Any
from app.tools.base import BaseTool
from app.config import OUTPUT_DIR

class PdfSplitterTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "pdf-splitter"

    @property
    def allowed_extensions(self) -> list:
        return [".pdf"]

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        page_num = int(params.get("page", 1)) if params else 1
        page_index = page_num - 1 # Zero-based index
        
        reader = PdfReader(file_path)
        if page_index < 0 or page_index >= len(reader.pages):
            raise ValueError(f"A página {page_num} não existe. O documento tem {len(reader.pages)} páginas.")
            
        writer = PdfWriter()
        writer.add_page(reader.pages[page_index])
        
        filename = f"page_{page_num}_{uuid.uuid4().hex}.pdf"
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        with open(output_path, "wb") as f_out:
            writer.write(f_out)
            
        return output_path
