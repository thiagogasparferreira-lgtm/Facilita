from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db.models import User, Conversion, Payment, Subscription

router = APIRouter()

@router.get("/dashboard")
def get_admin_dashboard(request: Request, db: Session = Depends(get_db)):
    # Na vida real, validar is_admin.
    # if not getattr(request.state, "user_email", None) or not db.query(User).filter(User.email==request.state.user_email, User.is_admin==True).first():
    #    raise HTTPException(status_code=403, detail="Acesso negado")
        
    total_users = db.query(func.count(User.id)).scalar()
    total_pro = db.query(func.count(User.id)).filter(User.is_pro == True).scalar()
    total_conversions = db.query(func.count(Conversion.id)).scalar()
    
    # MRR Simples
    mrr = db.query(func.sum(Payment.amount)).filter(Payment.status == 'approved').scalar() or 0.0
    
    # Conversões recentes
    recent = db.query(Conversion).order_by(Conversion.created_at.desc()).limit(15).all()
    recent_data = [{"id": c.id, "tool_id": c.tool_id, "status": c.status, "date": c.created_at} for c in recent]
    
    return {
        "metrics": {
            "mrr": round(mrr, 2),
            "users": total_users,
            "pro_users": total_pro,
            "conversions": total_conversions
        },
        "recent_logs": recent_data
    }
