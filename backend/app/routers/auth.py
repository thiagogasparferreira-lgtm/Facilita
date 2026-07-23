from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.database import get_db
from app.db.models import User
from app.core.security import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

router = APIRouter()

class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    
    # Auto-promote specific emails to Admin
    is_admin = user.email in ['admin@facilita.com', 'thiagogasparferreira@gmail.com']
    
    new_user = User(
        email=user.email, 
        hashed_password=hashed_password,
        name=user.name,
        is_admin=is_admin
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email, "is_pro": new_user.is_pro, "is_admin": new_user.is_admin},
        expires_delta=access_token_expires
    )
    
    return {"success": True, "access_token": access_token, "token_type": "bearer", "user": {"email": new_user.email, "name": new_user.name, "is_pro": new_user.is_pro, "is_admin": new_user.is_admin}}

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    # Auto-promote specific emails to Admin (retroactive fix)
    if not db_user.is_admin and db_user.email.lower() in ['admin@facilita.com', 'thiagogasparferreira@gmail.com']:
        db_user.is_admin = True
        db.commit()
        db.refresh(db_user)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email, "is_pro": db_user.is_pro, "is_admin": db_user.is_admin},
        expires_delta=access_token_expires
    )
    
    return {"success": True, "access_token": access_token, "token_type": "bearer", "user": {"email": db_user.email, "name": db_user.name, "is_pro": db_user.is_pro, "is_admin": db_user.is_admin}}

@router.get("/me")
def get_me(token: str, db: Session = Depends(get_db)):
    from app.core.security import decode_access_token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    email = payload.get("sub")
    db_user = db.query(User).filter(User.email == email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    # Generate a fresh token with the latest DB state
    from app.core.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
    from datetime import timedelta
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    new_token = create_access_token(
        data={"sub": db_user.email, "is_pro": db_user.is_pro, "is_admin": db_user.is_admin},
        expires_delta=access_token_expires
    )
        
    return {
        "email": db_user.email,
        "name": db_user.name,
        "is_pro": db_user.is_pro,
        "avatar_url": db_user.avatar_url,
        "language": db_user.language,
        "new_token": new_token
    }

class ForgotPassword(BaseModel):
    email: str

class ResetPassword(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(req: ForgotPassword, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == req.email).first()
    if not db_user:
        # Prevent email enumeration by always returning success
        return {"success": True, "message": "Se o e-mail existir, um link foi enviado."}
        
    from app.core.security import create_access_token
    from app.core.email import send_reset_email
    
    # Generate a 15-minute token specific for password reset
    reset_token = create_access_token(
        data={"sub": db_user.email, "type": "reset"},
        expires_delta=timedelta(minutes=15)
    )
    
    success = send_reset_email(db_user.email, reset_token)
    if not success:
        raise HTTPException(status_code=500, detail="Erro ao enviar e-mail de recuperação.")
        
    return {"success": True, "message": "Se o e-mail existir, um link foi enviado."}

@router.post("/reset-password")
def reset_password(req: ResetPassword, db: Session = Depends(get_db)):
    from app.core.security import decode_access_token, get_password_hash
    
    payload = decode_access_token(req.token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Token inválido ou expirado.")
        
    email = payload.get("sub")
    db_user = db.query(User).filter(User.email == email).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        
    db_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    
    return {"success": True, "message": "Senha atualizada com sucesso."}

class GoogleLogin(BaseModel):
    credential: str
    client_id: str

@router.post("/google-login")
def google_login(req: GoogleLogin, db: Session = Depends(get_db)):
    from google.oauth2 import id_token
    from google.auth.transport import requests
    import os
    import secrets
    from app.core.security import get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
    from datetime import timedelta
    
    try:
        # Validate the token
        idinfo = id_token.verify_oauth2_token(
            req.credential, 
            requests.Request(), 
            req.client_id
        )

        email = idinfo['email']
        name = idinfo.get('name', 'Usuário Google')
        avatar = idinfo.get('picture', None)
        
        db_user = db.query(User).filter(User.email == email).first()
        
        if not db_user:
            # Create user if doesn't exist
            random_password = secrets.token_hex(16)
            is_admin = email.lower() in ['admin@facilita.com', 'thiagogasparferreira@gmail.com']
            
            db_user = User(
                email=email,
                hashed_password=get_password_hash(random_password),
                name=name,
                avatar_url=avatar,
                is_admin=is_admin
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        else:
            # Update avatar and name if they changed
            if not db_user.avatar_url and avatar:
                db_user.avatar_url = avatar
            if not db_user.name and name:
                db_user.name = name
            db.commit()
            
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user.email, "is_pro": db_user.is_pro, "is_admin": db_user.is_admin},
            expires_delta=access_token_expires
        )
        
        return {
            "success": True, 
            "access_token": access_token, 
            "token_type": "bearer", 
            "user": {
                "email": db_user.email, 
                "name": db_user.name, 
                "is_pro": db_user.is_pro, 
                "is_admin": db_user.is_admin,
                "avatar_url": db_user.avatar_url
            }
        }

    except ValueError:
        raise HTTPException(status_code=400, detail="Token Google Inválido")
    except Exception as e:
        print(f"Google Login Error: {e}")
        raise HTTPException(status_code=500, detail="Falha ao processar login com Google")

from fastapi import Form
from fastapi.responses import RedirectResponse

@router.post("/google/callback")
def google_callback(credential: str = Form(...), db: Session = Depends(get_db)):
    from google.oauth2 import id_token
    from google.auth.transport import requests
    import secrets
    from app.core.security import get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
    from datetime import timedelta
    
    CLIENT_ID = "209055711301-qga9m15q53khrtrtmtd6ql8pis0861b7.apps.googleusercontent.com"
    try:
        idinfo = id_token.verify_oauth2_token(credential, requests.Request(), CLIENT_ID)
        email = idinfo['email']
        name = idinfo.get('name', 'Usuário Google')
        avatar = idinfo.get('picture', None)
        
        db_user = db.query(User).filter(User.email == email).first()
        
        if not db_user:
            random_password = secrets.token_hex(16)
            is_admin = email.lower() in ['admin@facilita.com', 'thiagogasparferreira@gmail.com']
            db_user = User(
                email=email,
                hashed_password=get_password_hash(random_password),
                name=name,
                avatar_url=avatar,
                is_admin=is_admin
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
        else:
            if not db_user.avatar_url and avatar: db_user.avatar_url = avatar
            if not db_user.name and name: db_user.name = name
            db.commit()
            
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": db_user.email, "is_pro": db_user.is_pro, "is_admin": db_user.is_admin},
            expires_delta=access_token_expires
        )
        
        return RedirectResponse(
            url=f"https://facilita-alpha.vercel.app/dashboard/index.html?google_token={access_token}",
            status_code=303
        )
    except Exception as e:
        print(f"Google Callback Error: {e}")
        return RedirectResponse(url="https://facilita-alpha.vercel.app/auth/login.html?error=google_failed", status_code=303)
