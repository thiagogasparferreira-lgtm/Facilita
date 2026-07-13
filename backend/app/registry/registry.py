from typing import Dict, Type
from app.tools.base import BaseTool
from app.tools.pdf_word import PdfWordTool
from app.tools.qr_code import QrCodeTool
from app.tools.password_gen import PasswordGenTool
from app.tools.image_compress import ImageCompressTool
from app.tools.img_to_pdf import ImgToPdfTool
from app.tools.pdf_splitter import PdfSplitterTool
from app.tools.watermark import WatermarkTool
from app.tools.pdf_merge import PdfMergeTool
from app.tools.pdf_rotate import PdfRotateTool
from app.tools.pdf_protect import PdfProtectTool
from app.tools.pdf_unprotect import PdfUnprotectTool
from app.tools.word_to_pdf import WordToPdfTool
from app.tools.pdf_watermark import PdfWatermarkTool
from app.tools.remove_bg import RemoveBgTool

class ToolRegistry:
    def __init__(self):
        self._registry: Dict[str, Type[BaseTool]] = {}

    def register(self, tool_id: str, tool_class: Type[BaseTool]):
        self._registry[tool_id] = tool_class

    def register_defaults(self):
        """Registra as ferramentas padrão do sistema"""
        self.register("pdf-word", PdfWordTool)
        self.register("word-pdf", WordToPdfTool)
        self.register("juntar-pdf", PdfMergeTool)
        self.register("pdf-splitter", PdfSplitterTool)
        self.register("rotacionar-pdf", PdfRotateTool)
        self.register("proteger-pdf", PdfProtectTool)
        self.register("desproteger-pdf", PdfUnprotectTool)
        self.register("pdf-watermark", PdfWatermarkTool)
        self.register("img-to-pdf", ImgToPdfTool)
        self.register("image-compress", ImageCompressTool)
        self.register("comprimir-imagem", ImageCompressTool)   # alias PT-BR
        self.register("watermark", WatermarkTool)
        self.register("qr-code", QrCodeTool)
        self.register("password-gen", PasswordGenTool)
        self.register("remove-bg", RemoveBgTool)
        self.register("remover-fundo", RemoveBgTool)

    def get_tool(self, tool_id: str) -> BaseTool:
        if tool_id not in self._registry:
            raise KeyError(f"Ferramenta '{tool_id}' não encontrada no registro.")
        return self._registry[tool_id]()

    def list_tools(self) -> list:
        return list(self._registry.keys())

registry = ToolRegistry()
registry.register_defaults()
