import os
import uuid
from PIL import Image
from typing import Dict, Any
from app.tools.base import BaseTool
from app.config import OUTPUT_DIR

class ImageCompressTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "image-compress"

    @property
    def allowed_extensions(self) -> list:
        return [".jpg", ".jpeg", ".png", ".webp"]

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        # Parâmetro de qualidade (0 a 100)
        quality = int(params.get("quality", 70)) if params else 70
            
        # Abrir imagem
        img = Image.open(file_path)
        
        # Corrigir orientação para não deitar as fotos
        if hasattr(img, '_getexif'):
            from PIL import ImageOps
            img = ImageOps.exif_transpose(img)
            
        # Se for PNG com transparência e for salvar como JPEG, converter pra RGB
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        # Gerar output
        filename = f"compressed_{uuid.uuid4().hex}.jpg"
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        img.save(output_path, "JPEG", optimize=True, quality=quality)
        return output_path
