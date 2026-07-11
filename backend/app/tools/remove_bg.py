import os
import uuid
from typing import Dict, Any
from PIL import Image
from app.tools.base import BaseTool
from app.config import OUTPUT_DIR

# Verifica se está rodando no Render para evitar carregar bibliotecas pesadas de IA
IS_RENDER = os.environ.get("RENDER") == "true" or os.environ.get("DATABASE_URL") is not None

def remove_background_pil(image: Image.Image, tolerance: int = 30) -> Image.Image:
    """
    Remove o fundo de forma super-leve e rápida usando Pillow.
    Detecta a cor média das bordas (cantos) e substitui por transparência (alpha=0).
    Ideal para hospedar em servidores com poucos recursos (como os 512MB de RAM do Render Free Tier).
    """
    img = image.convert("RGBA")
    data = img.getdata()
    
    # Amostra as cores dos cantos para deduzir o fundo
    width, height = img.size
    corners = [
        img.getpixel((0, 0)),
        img.getpixel((width - 1, 0)),
        img.getpixel((0, height - 1)),
        img.getpixel((width - 1, height - 1))
    ]
    
    # Média de cor dos cantos
    bg_r = sum(c[0] for c in corners) // 4
    bg_g = sum(c[1] for c in corners) // 4
    bg_b = sum(c[2] for c in corners) // 4
    
    new_data = []
    for item in data:
        # Distância Euclidiana de cores
        r_diff = item[0] - bg_r
        g_diff = item[1] - bg_g
        b_diff = item[2] - bg_b
        distance = (r_diff**2 + g_diff**2 + b_diff**2) ** 0.5
        
        if distance < tolerance:
            # Substitui por transparente
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    return img

class RemoveBgTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "remover-fundo"

    @property
    def allowed_extensions(self) -> list:
        return [".png", ".jpg", ".jpeg", ".webp"]

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        # Carrega a imagem original
        input_image = Image.open(file_path)
        
        # Decide qual método usar para a remoção
        if IS_RENDER:
            # Em produção (Render), usa o extrator de canal alfa do Pillow para economizar RAM e evitar OOM
            output_image = remove_background_pil(input_image)
        else:
            # Localmente, tenta usar o rembg (IA) se estiver disponível
            try:
                from rembg import remove, new_session
                # Inicializa com modelo leve u2netp
                session = new_session("u2netp")
                output_image = remove(input_image, session=session)
            except Exception as e:
                print(f"[RemoveBgTool] Falha ao carregar rembg localmente, usando fallback do Pillow: {e}")
                output_image = remove_background_pil(input_image)
        
        # Gera o arquivo final em formato PNG para suportar transparência
        unique_id = uuid.uuid4().hex
        output_filename = f"nobg_{unique_id}.png"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        output_image.save(output_path, "PNG")
        return output_path
