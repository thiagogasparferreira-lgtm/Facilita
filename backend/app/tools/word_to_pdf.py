import os
import uuid
from typing import Dict, Any
from app.tools.base import BaseTool
from app.config import OUTPUT_DIR

class WordToPdfTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "word-pdf"

    @property
    def allowed_extensions(self) -> list:
        return [".docx"]

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        if not file_path.lower().endswith(".docx"):
            raise ValueError("O arquivo deve ser um .docx.")
            
        unique_id = uuid.uuid4().hex
        output_filename = f"converted_{unique_id}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        import docx
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        
        doc = docx.Document(file_path)
        c = canvas.Canvas(output_path, pagesize=letter)
        width, height = letter
        y = height - 50
        
        for para in doc.paragraphs:
            if y < 50:
                c.showPage()
                y = height - 50
            c.drawString(50, y, para.text[:100]) # Simples extração de texto
            y -= 20
            
        c.save()
        return output_path
