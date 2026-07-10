import random
import string
import time
from typing import Dict, Any
from app.tools.base import BaseTool

class PasswordGenTool(BaseTool):
    @property
    def tool_id(self) -> str:
        return "password-gen"

    @property
    def allowed_extensions(self) -> list:
        return [".txt", ".png", ".jpg", ".jpeg", ".pdf"]  # Permite arquivos dummy

    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        raise NotImplementedError("O gerador de senhas não utiliza o método execute.")

    def run(self, file_path: str, filename: str, file_size: int, user_plan: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        start_time = time.time()
        if not params:
            params = {}
            
        length = int(params.get("length", 16))
        use_upper = str(params.get("uppercase", "true")).lower() == "true"
        use_lower = str(params.get("lowercase", "true")).lower() == "true"
        use_numbers = str(params.get("numbers", "true")).lower() == "true"
        use_symbols = str(params.get("symbols", "true")).lower() == "true"
        
        characters = ""
        if use_lower: characters += string.ascii_lowercase
        if use_upper: characters += string.ascii_uppercase
        if use_numbers: characters += string.digits
        if use_symbols: characters += "!@#$%^&*()-_=+[]{}|;:,.<>?"
            
        if not characters:
            characters = string.ascii_letters + string.digits
            
        password = "".join(random.choice(characters) for _ in range(length))
        exec_time = round(time.time() - start_time, 2)
        
        return {
            "success": True,
            "tool": self.tool_id,
            "download_url": None,
            "result_text": password,
            "execution_time": exec_time,
            "size": len(password),
            "message": "Senha gerada com sucesso."
        }
