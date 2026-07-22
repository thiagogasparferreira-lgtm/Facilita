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
        
    return {
        "email": db_user.email,
        "name": db_user.name,
        "is_pro": db_user.is_pro,
        "avatar_url": db_user.avatar_url,
        "language": db_user.language
    }
