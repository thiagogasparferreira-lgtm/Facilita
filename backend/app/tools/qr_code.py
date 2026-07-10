import os
import uuid
import qrcode
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
        unique_id = uuid.uuid4().hex
        output_filename = f"qrcode_{unique_id}.png"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        text = params.get("text", "")
        # Se não vier texto nos parâmetros, tenta ler do arquivo temporário
        if not text and os.path.exists(file_path):
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read().strip()
            except Exception:
                pass
                
        if not text:
            text = "https://facilita-alpha.vercel.app"
            
        color = params.get("color", "000000")
        if not color.startswith("#"):
            fill_color = f"#{color}"
        else:
            fill_color = color
            
        size_str = params.get("size", "300")
        try:
            size_px = int(size_str)
        except ValueError:
            size_px = 300
            
        box_size = max(1, size_px // 30)
            
        qr = qrcode.QRCode(
            version=1,
            box_size=box_size,
            border=4
        )
        qr.add_data(text)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color=fill_color, back_color="white")
        img.save(output_path)
        
        return output_path
