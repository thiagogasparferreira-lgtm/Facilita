from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db.models import User, Conversion, Download, Subscription

router = APIRouter()

@router.get("/dashboard")
def get_user_dashboard(request: Request, db: Session = Depends(get_db)):
    if not request.state.is_authenticated:
        raise HTTPException(status_code=401, detail="Não autenticado")
        
    user = db.query(User).filter(User.email == request.state.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Estatísticas
    conversions_count = db.query(func.count(Conversion.id)).filter(Conversion.user_id == user.id).scalar()
    time_saved = db.query(func.sum(Conversion.execution_time)).filter(Conversion.user_id == user.id).scalar() or 0.0
    bytes_saved = db.query(func.sum(Conversion.original_size - Conversion.result_size)).filter(Conversion.user_id == user.id, Conversion.result_size != None).scalar() or 0
    
    # Histórico recente
    recent_conversions = db.query(Conversion).filter(Conversion.user_id == user.id).order_by(Conversion.created_at.desc()).limit(10).all()
    history = [{"id": c.id, "tool": c.tool.name if c.tool else c.tool_id, "filename": c.original_filename, "date": c.created_at, "status": c.status} for c in recent_conversions]
    
    # Plano
    sub = db.query(Subscription).filter(Subscription.user_id == user.id, Subscription.status == 'active').order_by(Subscription.valid_until.desc()).first()
    
    return {
        "stats": {
            "total_conversions": conversions_count,
            "time_saved_seconds": round(time_saved, 2),
            "mb_saved": round(bytes_saved / (1024 * 1024), 2)
        },
        "plan": {
            "name": sub.plan_name if sub else "FREE",
            "valid_until": sub.valid_until if sub else None,
            "is_pro": user.is_pro
        },
        "history": history
    }
