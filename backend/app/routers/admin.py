from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.db.models import User, Conversion, Payment, Subscription, SystemLog
from datetime import datetime

router = APIRouter()

def require_admin(request: Request, db: Session = Depends(get_db)):
    """Dependência que garante que o usuário autenticado é admin."""
    if not request.state.is_authenticated:
        raise HTTPException(status_code=401, detail="Autenticação necessária.")
    if not request.state.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradores podem acessar este recurso.")
    # Valida is_admin também no banco (dupla verificação)
    user = db.query(User).filter(User.email == request.state.user_email).first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    return user


@router.get("/dashboard")
def get_admin_dashboard(admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Resumo geral do painel administrativo."""
    total_users = db.query(func.count(User.id)).scalar()
    total_pro = db.query(func.count(User.id)).filter(User.is_pro == True).scalar()
    total_conversions = db.query(func.count(Conversion.id)).scalar()
    mrr = db.query(func.sum(Payment.amount)).filter(Payment.status == 'approved').scalar() or 0.0

    recent = db.query(Conversion).order_by(Conversion.created_at.desc()).limit(15).all()
    recent_data = [{"id": c.id, "tool_id": c.tool_id, "status": c.status, "date": str(c.created_at)} for c in recent]

    return {
        "metrics": {
            "mrr": round(mrr, 2),
            "users": total_users,
            "pro_users": total_pro,
            "conversions": total_conversions
        },
        "recent_logs": recent_data
    }


@router.get("/stats")
def get_admin_stats(admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Métricas detalhadas para o painel administrativo."""
    total_users = db.query(func.count(User.id)).scalar()
    total_pro = db.query(func.count(User.id)).filter(User.is_pro == True).scalar()
    total_conversions = db.query(func.count(Conversion.id)).scalar()
    total_revenue = db.query(func.sum(Payment.amount)).filter(Payment.status == 'approved').scalar() or 0.0

    # Últimas 7 conversões por ferramenta
    top_tools_raw = (
        db.query(Conversion.tool_id, func.count(Conversion.id).label("count"))
        .group_by(Conversion.tool_id)
        .order_by(func.count(Conversion.id).desc())
        .limit(10)
        .all()
    )
    top_tools = [{"tool_id": t[0], "count": t[1]} for t in top_tools_raw]

    return {
        "total_users": total_users,
        "total_pro_users": total_pro,
        "total_conversions": total_conversions,
        "total_revenue": round(total_revenue, 2),
        "top_tools": top_tools,
        "conversion_rate": round((total_pro / total_users * 100) if total_users > 0 else 0, 1)
    }


@router.get("/users")
def get_admin_users(
    skip: int = 0,
    limit: int = 50,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Lista de usuários paginada para o painel administrativo."""
    users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    total = db.query(func.count(User.id)).scalar()

    return {
        "total": total,
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "is_pro": u.is_pro,
                "is_admin": u.is_admin,
                "created_at": str(u.created_at)
            }
            for u in users
        ]
    }


@router.get("/logs")
def get_admin_logs(
    limit: int = 50,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Logs de sistema e conversões recentes para o painel administrativo."""
    recent_conversions = (
        db.query(Conversion)
        .order_by(Conversion.created_at.desc())
        .limit(limit)
        .all()
    )

    system_logs = (
        db.query(SystemLog)
        .order_by(SystemLog.created_at.desc())
        .limit(limit)
        .all()
    )

    # Tradução amigável das ferramentas
    tool_translations = {
        "pdf-word": "PDF para Word",
        "word-pdf": "Word para PDF",
        "juntar-pdf": "Juntar PDF",
        "pdf-splitter": "Dividir PDF",
        "rotacionar-pdf": "Rotacionar PDF",
        "proteger-pdf": "Proteger PDF",
        "desproteger-pdf": "Desproteger PDF",
        "pdf-watermark": "Marca d'água PDF",
        "img-to-pdf": "Imagem para PDF",
        "image-compress": "Comprimir Imagem",
        "comprimir-imagem": "Comprimir Imagem",
        "watermark": "Marca d'água em Imagem",
        "qr-code": "Gerador de QR Code",
        "password-gen": "Gerador de Senhas Fortes",
        "remove-bg": "Remover Fundo",
        "remover-fundo": "Remover Fundo",
        "Ferramenta Desconhecida": "Teste de Sistema (Anterior)"
    }

    return {
        "conversions": [
            {
                "id": c.id,
                "tool_id": tool_translations.get(c.tool.tool_id if c.tool else "unknown", c.tool.name if c.tool else "Teste de Sistema (Anterior)"),
                "status": c.status,
                "original_filename": c.original_filename,
                "execution_time": c.execution_time,
                "created_at": str(c.created_at),
                "user_email": c.user.email if c.user else "anônimo"
            }
            for c in recent_conversions
        ],
        "system_logs": [
            {
                "id": l.id,
                "event_type": l.event_type,
                "description": l.description,
                "created_at": str(l.created_at)
            }
            for l in system_logs
        ]
    }


@router.get("/users")
def get_admin_users(
    limit: int = 50,
    offset: int = 0,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Lista os usuários cadastrados para o painel administrativo."""
    users = db.query(User).order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    total = db.query(func.count(User.id)).scalar()
    
    return {
        "total": total,
        "users": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "is_pro": u.is_pro,
                "is_admin": u.is_admin,
                "created_at": str(u.created_at)
            }
            for u in users
        ]
    }

@router.delete("/users/{user_id}")
def delete_admin_user(
    user_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Deleta um usuário permanentemente."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    # Travas de segurança
    if target_user.id == admin_user.id:
        raise HTTPException(status_code=403, detail="Você não pode excluir sua própria conta.")
    if target_user.email.lower() == 'thiagogasparferreira@gmail.com':
        raise HTTPException(status_code=403, detail="O Super Admin principal não pode ser excluído.")

    # Exclui conversões relacionadas
    db.query(Conversion).filter(Conversion.user_id == user_id).delete()
    
    # Exclui o usuário
    db.delete(target_user)
    db.commit()
    
    return {"success": True, "message": "Usuário excluído com sucesso."}

@router.patch("/users/{user_id}/plan")
def toggle_user_plan(
    user_id: int,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Alterna o plano de um usuário entre FREE e PRO."""
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        
    # Travas de segurança
    if target_user.id == admin_user.id and target_user.is_pro:
        raise HTTPException(status_code=403, detail="Você não pode rebaixar sua própria conta para o plano gratuito.")
        
    target_user.is_pro = not target_user.is_pro
    db.commit()
    
    plan_name = "PRO" if target_user.is_pro else "FREE"
    return {"success": True, "message": f"O plano do usuário foi alterado para {plan_name}.", "is_pro": target_user.is_pro}
