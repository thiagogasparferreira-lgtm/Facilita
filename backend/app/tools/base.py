import time
import os
from abc import ABC, abstractmethod
from typing import Dict, Any
from app.config import LIMITS_FILE_SIZE

class BaseTool(ABC):
    @property
    @abstractmethod
    def tool_id(self) -> str:
        """Retorna o ID único da ferramenta (ex: pdf-word)"""
        pass

    @property
    @abstractmethod
    def allowed_extensions(self) -> list:
        """Lista de extensões permitidas (ex: ['.pdf'])"""
        pass

    def validate_size(self, file_size: int, plan: str) -> bool:
        """Valida o tamanho do arquivo com base no plano do usuário"""
        limit = LIMITS_FILE_SIZE.get(plan, LIMITS_FILE_SIZE["FREE"])
        return file_size <= limit

    def validate_format(self, filename: str) -> bool:
        """Valida se o formato da extensão é permitido para a ferramenta"""
        ext = os.path.splitext(filename.lower())[1]
        return ext in self.allowed_extensions

    @abstractmethod
    def execute(self, file_path: str, params: Dict[str, Any], user_plan: str) -> str:
        """
        Executa a conversão/processamento do arquivo.
        Deve retornar o caminho físico para o arquivo de saída gerado.
        """
        pass

    def run(self, file_path: str, filename: str, file_size: int, user_plan: str, params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Método wrapper central de execução da ferramenta.
        Garante a medição do tempo de execução e a resposta padronizada.
        """
        if params is None:
            params = {}

        # 1. Validações básicas de formato
        if not self.validate_format(filename):
            return {
                "success": False,
                "tool": self.tool_id,
                "download_url": None,
                "execution_time": 0.0,
                "size": 0,
                "message": f"Formato de arquivo não suportado. Extensões permitidas: {', '.join(self.allowed_extensions)}."
            }

        # 2. Validações básicas de tamanho
        if not self.validate_size(file_size, user_plan):
            limit_mb = LIMITS_FILE_SIZE.get(user_plan, LIMITS_FILE_SIZE["FREE"]) / (1024 * 1024)
            return {
                "success": False,
                "tool": self.tool_id,
                "download_url": None,
                "execution_time": 0.0,
                "size": 0,
                "message": f"Tamanho de arquivo excede o limite permitido para o seu plano ({limit_mb:.1f} MB)."
            }

        start_time = time.time()
        try:
            # 3. Execução real da lógica da ferramenta
            output_file_path = self.execute(file_path, params, user_plan)
            execution_time = round(time.time() - start_time, 2)
            
            # Se for bem-sucedido, calcula o tamanho do output
            output_size = os.path.getsize(output_file_path)
            output_filename = os.path.basename(output_file_path)
            
            return {
                "success": True,
                "tool": self.tool_id,
                "download_url": f"/downloads/{output_filename}",
                "execution_time": execution_time,
                "size": output_size,
                "message": "Operação realizada com sucesso."
            }
        except Exception as e:
            execution_time = round(time.time() - start_time, 2)
            print(f"Erro ao executar a ferramenta {self.tool_id}: {str(e)}")
            return {
                "success": False,
                "tool": self.tool_id,
                "download_url": None,
                "execution_time": execution_time,
                "size": 0,
                "message": f"Erro interno ao processar o arquivo: {str(e)}"
            }
