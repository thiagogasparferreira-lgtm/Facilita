import os
import time
import shutil
import uuid
from fastapi import FastAPI, Request, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.config import UPLOAD_DIR, OUTPUT_DIR, APP_VERSION
from app.registry.registry import registry
from app.middleware.auth import auth_middleware
from app.middleware.limits import rate_limit_middleware
from app.middleware.logger import logger_middleware
from app.db.database import Base, engine
from app.routers import auth, admin

# Inicializa o FastAPI
app = FastAPI(
    title="Facilita API",
    description="Motor central de ferramentas do Facilita SaaS",
    version=APP_VERSION
)

# Cria as tabelas do banco de dados (SQLite local) se não existirem
from app.db import models  # Força o SQLAlchemy a mapear as tabelas antes de criar
Base.metadata.create_all(bind=engine)

# Inclusão de Rotas Modulares
from app.routers import auth, admin, users, payments

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticação"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Administração"])
app.include_router(users.router, prefix="/api/v1/user", tags=["Usuário"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["Pagamentos"])


# Configuração de CORS (Habilita comunicação completa com o frontend local)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://facilita-alpha.vercel.app",
        "http://localhost:3000"
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro de Middlewares (A ordem de execução é de baixo para cima nos decoradores)
@app.middleware("http")
async def apply_logger(request: Request, call_next):
    return await logger_middleware(request, call_next)

@app.middleware("http")
async def apply_rate_limit(request: Request, call_next):
    return await rate_limit_middleware(request, call_next)

@app.middleware("http")
async def apply_auth(request: Request, call_next):
    return await auth_middleware(request, call_next)

# Monta o diretório de downloads estáticos
# Permite que os arquivos convertidos na pasta storage/outputs sejam baixados diretamente
app.mount("/downloads", StaticFiles(directory=str(OUTPUT_DIR)), name="downloads")

@app.get("/health")
def health_check():
    """Rota de Health Check"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "storage": {
            "uploads_exists": os.path.exists(UPLOAD_DIR),
            "outputs_exists": os.path.exists(OUTPUT_DIR)
        }
    }

@app.get("/version")
def get_version():
    """Rota de versão da API"""
    return {
        "version": APP_VERSION,
        "api": "v1"
    }

@app.post("/api/v1/tools/{tool}")
async def run_tool(
    tool: str,
    request: Request,
    file: UploadFile = File(...),
    params_str: str = Form(None)  # Parâmetros adicionais opcionais (ex: cores do QR code)
):
    """
    Rota dinâmica e genérica para processamento de ferramentas.
    Identifica a ferramenta pelo parâmetro, realiza as validações e executa o processamento.
    """
    user_plan = getattr(request.state, "user_plan", "FREE")
    user_email = getattr(request.state, "user_email", "anonymous@facilita.com")
    
    # 1. Recupera a ferramenta a partir do registro dinâmico
    try:
        tool_instance = registry.get_tool(tool)
    except KeyError:
        return JSONResponse(
            status_code=404,
            content={
                "success": False,
                "tool": tool,
                "download_url": None,
                "execution_time": 0.0,
                "size": 0,
                "message": f"A ferramenta '{tool}' não está cadastrada na plataforma."
            }
        )

    # 2. Salva o arquivo enviado temporariamente na pasta de Uploads
    temp_filename = f"{uuid.uuid4().hex}_{file.filename}"
    upload_path = os.path.join(UPLOAD_DIR, temp_filename)
    
    try:
        # Copia o stream de upload do arquivo para o disco
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_size = os.path.getsize(upload_path)
        
        # Parse de parâmetros adicionais recebidos em formulário
        import json
        params = {}
        if params_str:
            try:
                params = json.loads(params_str)
            except json.JSONDecodeError:
                pass
        
        # 3. Executa a ferramenta dinamicamente
        result = tool_instance.run(
            file_path=upload_path,
            filename=file.filename,
            file_size=file_size,
            user_plan=user_plan,
            params=params
        )
        
        # 4. Registra no Banco de Dados
        from app.db.database import get_db
        from app.db.models import User, Conversion, Tool as DBTool
        
        db_session = next(get_db())
        user_id = None
        if request.state.is_authenticated:
            user = db_session.query(User).filter(User.email == user_email).first()
            if user: user_id = user.id
            
        tool_db = db_session.query(DBTool).filter(DBTool.tool_id == tool).first()
        t_id = tool_db.id if tool_db else None
            
        conv = Conversion(
            user_id=user_id,
            tool_id=t_id,
            original_filename=file.filename,
            original_size=file_size,
            result_size=result.get("size", 0),
            execution_time=result.get("execution_time", 0.0),
            status="success" if result["success"] else "failed"
        )
        db_session.add(conv)
        db_session.commit()
        
        # Adiciona o host correto na URL de download se for bem-sucedido
        if result["success"] and result["download_url"]:
            # Adiciona o protocolo e endereço da API de download dinamicamente
            base_url = str(request.base_url).rstrip("/")
            result["download_url"] = f"{base_url}{result['download_url']}"
            
        return result

    except Exception as e:
        print(f"[Main] Erro fatal no roteamento da ferramenta {tool}: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "tool": tool,
                "download_url": None,
                "execution_time": 0.0,
                "size": 0,
                "message": f"Erro crítico no servidor ao processar o arquivo: {str(e)}"
            }
        )
    finally:
        # Garante a limpeza do arquivo temporário enviado após processamento
        if os.path.exists(upload_path):
            try:
                os.remove(upload_path)
            except Exception:
                pass
