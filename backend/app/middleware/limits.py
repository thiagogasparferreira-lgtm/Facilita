import os
import time
import json
import redis.asyncio as redis
from fastapi import Request
from fastapi.responses import JSONResponse
from app.config import (
    RATE_LIMIT_WINDOW_SECONDS,
    RATE_LIMIT_MAX_REQUESTS_FREE,
    RATE_LIMIT_MAX_REQUESTS_PRO
)

REDIS_URL = os.environ.get("REDIS_URL")
redis_client = None
if REDIS_URL:
    try:
        redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    except Exception:
        redis_client = None

# Fallback em memória
request_history = {}

async def check_rate_limit(key: str, max_requests: int, window: int) -> bool:
    """Retorna True se o limite foi excedido, False caso contrário"""
    current_time = time.time()
    
    if redis_client:
        try:
            # Implementação Redis usando pipeline e zset (Sliding window)
            redis_key = f"rate_limit:{key}"
            cutoff = current_time - window
            
            async with redis_client.pipeline(transaction=True) as pipe:
                # Remove timestamps antigos
                pipe.zremrangebyscore(redis_key, 0, cutoff)
                # Conta quantos existem na janela
                pipe.zcard(redis_key)
                # Adiciona o novo
                pipe.zadd(redis_key, {str(current_time): current_time})
                # Define expiração para limpeza automática
                pipe.expire(redis_key, window)
                
                results = await pipe.execute()
                
            count = results[1]
            return count >= max_requests
        except Exception:
            pass # Fallback silencioso para memória se Redis falhar
            
    # Implementação em Memória (Fallback)
    if key not in request_history:
        request_history[key] = []
    
    history = [t for t in request_history[key] if current_time - t < window]
    request_history[key] = history
    
    if len(history) >= max_requests:
        return True
        
    request_history[key].append(current_time)
    return False

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
        
        exceeded = await check_rate_limit(auth_limit_key, AUTH_MAX, RATE_LIMIT_WINDOW_SECONDS)
        if exceeded:
            return JSONResponse(status_code=429, content={
                "success": False, "tool": None,
                "download_url": None, "execution_time": 0.0, "size": 0,
                "message": "Muitas tentativas de login. Aguarde 1 minuto antes de tentar novamente."
            })
    # -------------------------------------------------------

    # A chave do rate limit será o email (se autenticado) ou o IP do cliente
    limit_key = user_email if user_email != "anonymous@facilita.com" else client_ip

    # Define o limite máximo baseado no plano ou método
    if auth_method == "api_key":
        max_requests = 1000
    else:
        max_requests = RATE_LIMIT_MAX_REQUESTS_PRO if user_plan == "PRO" else RATE_LIMIT_MAX_REQUESTS_FREE

    exceeded = await check_rate_limit(limit_key, max_requests, RATE_LIMIT_WINDOW_SECONDS)
    
    if exceeded:
        if os.environ.get("DEBUG") == "true":
            print(f"[RateLimit] Bloqueado excesso de requisições para {limit_key}")
            
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

    return await call_next(request)
