from fastapi import Request
from fastapi.responses import JSONResponse
import logging
from app.core.security import decode_access_token

logger = logging.getLogger(__name__)

async def auth_middleware(request: Request, call_next):
    """
    Middleware para extrair a identidade do usuário a partir do Authorization header.
    Injeta no request.state os dados do usuário para uso posterior.
    """
    auth_header = request.headers.get("Authorization")
    
    # Defaults para acesso anônimo
    request.state.user_email = "anonymous@facilita.com"
    request.state.user_plan = "FREE"
    request.state.is_authenticated = False
    request.state.is_admin = False
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = decode_access_token(token)
        
        if payload:
            request.state.user_email = payload.get("sub", "anonymous@facilita.com")
            request.state.user_plan = "PRO" if payload.get("is_pro") else "FREE"
            request.state.is_authenticated = True
            request.state.is_admin = bool(payload.get("is_admin", False))
            
    response = await call_next(request)
    return response
