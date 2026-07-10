import time
from fastapi import Request

async def logger_middleware(request: Request, call_next):
    path = request.url.path
    if path in ["/health", "/version"] or path.startswith("/downloads/"):
        return await call_next(request)

    start_time = time.time()
    
    # Executa a requisição
    response = await call_next(request)
    
    duration = round((time.time() - start_time) * 1000, 2)
    
    user_email = getattr(request.state, "user_email", "anonymous@facilita.com")
    user_plan = getattr(request.state, "user_plan", "FREE")
    auth_method = getattr(request.state, "auth_method", "session")

    print(
        f"[Logger] [{request.method}] {path} | "
        f"Usuário: {user_email} ({user_plan}) | Auth: {auth_method} | "
        f"Status: {response.status_code} | Tempo: {duration}ms"
    )
    
    return response
