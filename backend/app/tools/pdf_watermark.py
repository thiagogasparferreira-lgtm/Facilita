import os
import uuid
import io
from typing import Dict, Any
from PyPDF2 import PdfReader, PdfWriter
from app.tools.base import BaseTool
from app.config import OUTPUT_DIR

class PdfWatermarkTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "pdf-watermark"

    @property
    def allowed_extensions(self) -> list:
        return [".pdf"]

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        if not file_path.lower().endswith(".pdf"):
            raise ValueError("O arquivo deve ser um PDF.")
            
        text = params.get("text", "CONFIDENCIAL") if params else "CONFIDENCIAL"
        
        unique_id = uuid.uuid4().hex
        output_filename = f"watermarked_{unique_id}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        
        # Cria a marca d'água em memória
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        can.setFont("Helvetica-Bold", 60)
        can.setFillColorRGB(0.5, 0.5, 0.5, alpha=0.3)
        can.saveState()
        can.translate(300, 400)
        can.rotate(45)
        can.drawCentredString(0, 0, text)
        can.restoreState()
        can.save()
        
        packet.seek(0)
        watermark_pdf = PdfReader(packet)
        watermark_page = watermark_pdf.pages[0]
        
        reader = PdfReader(file_path)
        writer = PdfWriter()
        
        for page in reader.pages:
            page.merge_page(watermark_page)
            writer.add_page(page)
            
        with open(output_path, "wb") as f_out:
            writer.write(f_out)
            
        return output_path
