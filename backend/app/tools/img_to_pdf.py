import os
import uuid
from PIL import Image
from typing import Dict, Any
from app.tools.base import BaseTool
from app.config import OUTPUT_DIR

class ImgToPdfTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "img-to-pdf"

    @property
    def allowed_extensions(self) -> list:
        return [".jpg", ".jpeg", ".png", ".webp"]

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        img = Image.open(file_path)
        if img.mode == "RGBA":
            img = img.convert("RGB")
            
        filename = f"document_{uuid.uuid4().hex}.pdf"
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        img.save(output_path, "PDF", resolution=100.0)
        return output_path
