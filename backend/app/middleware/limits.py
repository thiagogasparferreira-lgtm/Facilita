import time
from fastapi import Request
from fastapi.responses import JSONResponse
from app.config import (
    RATE_LIMIT_WINDOW_SECONDS,
    RATE_LIMIT_MAX_REQUESTS_FREE,
    RATE_LIMIT_MAX_REQUESTS_PRO
)

# Dicionário em memória para controlar os IPs/Contas
# Chave: string (ip ou email), Valor: lista de timestamps
request_history = {}

async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path
    if path in ["/health", "/version"] or path.startswith("/downloads/"):
        return await call_next(request)

    # Identifica o usuário por email ou pelo IP do cliente
    client_ip = request.client.host if request.client else "unknown"
    user_email = getattr(request.state, "user_email", "anonymous@facilita.com")
    user_plan = getattr(request.state, "user_plan", "FREE")
    auth_method = getattr(request.state, "auth_method", "session")

    # -------------------------------------------------------
    # PROTEÇÃO ANTI-BRUTE-FORCE: rotas de auth têm limite rígido por IP
    # -------------------------------------------------------
    AUTH_ROUTES = ["/api/v1/auth/login", "/api/v1/auth/register"]
    if any(path.startswith(r) for r in AUTH_ROUTES):
        auth_limit_key = f"auth::{client_ip}"
        AUTH_MAX = 5       # máximo 5 tentativas por janela
        current_time = time.time()
        if auth_limit_key not in request_history:
            request_history[auth_limit_key] = []
        auth_history = [t for t in request_history[auth_limit_key]
                        if current_time - t < RATE_LIMIT_WINDOW_SECONDS]
        request_history[auth_limit_key] = auth_history
        if len(auth_history) >= AUTH_MAX:
            return JSONResponse(status_code=429, content={
                "success": False, "tool": None,
                "download_url": None, "execution_time": 0.0, "size": 0,
                "message": "Muitas tentativas de login. Aguarde 1 minuto antes de tentar novamente."
            })
        request_history[auth_limit_key].append(current_time)
    # -------------------------------------------------------

    # A chave do rate limit será o email (se autenticado) ou o IP do cliente
    limit_key = user_email if user_email != "anonymous@facilita.com" else client_ip

    # Define o limite máximo baseado no plano ou método
    if auth_method == "api_key":
        # API Keys possuem limites muito altos ou sem limites
        max_requests = 1000
    else:
        max_requests = RATE_LIMIT_MAX_REQUESTS_PRO if user_plan == "PRO" else RATE_LIMIT_MAX_REQUESTS_FREE

    current_time = time.time()
    
    # Cria a entrada se for o primeiro acesso
    if limit_key not in request_history:
        request_history[limit_key] = []

    # Filtra as requisições antigas que estão fora da janela de tempo
    history = request_history[limit_key]
    history = [t for t in history if current_time - t < RATE_LIMIT_WINDOW_SECONDS]
    request_history[limit_key] = history

    # Valida se excedeu o limite
    if len(history) >= max_requests:
        print(f"[RateLimit] Bloqueado excesso de requisições para {limit_key}: {len(history)}/{max_requests}")
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "tool": None,
                "download_url": None,
                "execution_time": 0.0,
                "size": 0,
                "message": "Você atingiu o limite de requisições. Por favor, aguarde um momento antes de tentar novamente."
            }
        )

    # Registra o acesso atual
    request_history[limit_key].append(current_time)
    
    return await call_next(request)
