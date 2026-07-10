import os
import uuid
from PIL import Image, ImageDraw, ImageFont
from typing import Dict, Any
from app.tools.base import BaseTool
from app.config import OUTPUT_DIR

class WatermarkTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "watermark"

    @property
    def allowed_extensions(self) -> list:
        return [".jpg", ".jpeg", ".png", ".webp"]

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        text = str(params.get("text", "Confidencial")) if params else "Confidencial"
        
        img = Image.open(file_path).convert("RGBA")
        
        # Criar uma imagem transparente para a marca d'água
        txt = Image.new("RGBA", img.size, (255, 255, 255, 0))
        d = ImageDraw.Draw(txt)
        
        width, height = img.size
        # Tamanho da fonte dinâmico (aproximadamente 10% da largura)
        font_size = int(width * 0.1)
        if font_size < 10: font_size = 10
        
        try:
            # Tentar carregar fonte padrão (no Windows ou Linux)
            # Como Pillow às vezes não acha fonte, faremos fallback pra fonte default caso dê erro
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.load_default()
            
        # Cor branca com 40% de opacidade (100 de 255)
        fill_color = (255, 255, 255, 100)
        
        # Posicionar no centro (tentativa simples)
        d.text((width//4, height//2), text, font=font, fill=fill_color)
        
        # Rotacionar a camada de texto
        txt = txt.rotate(30, expand=0)
        
        out = Image.alpha_composite(img, txt)
        if out.mode == "RGBA":
            out = out.convert("RGB")
            
        filename = f"watermark_{uuid.uuid4().hex}.jpg"
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        out.save(output_path, "JPEG")
        return output_path
