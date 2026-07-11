from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid
import time
from app.db.database import get_db
from app.db.models import Payment, User, Subscription
from datetime import datetime, timedelta

router = APIRouter()

class PixRequest(BaseModel):
    plan_name: str # ex: PRO_MONTHLY

@router.post("/pix/generate")
def generate_pix(request_data: PixRequest, request: Request, db: Session = Depends(get_db)):
    if not request.state.is_authenticated:
        raise HTTPException(status_code=401, detail="Você precisa estar logado para assinar.")
        
    user_email = request.state.user_email
    user = db.query(User).filter(User.email == user_email).first()
    
    # Mocking Mercado Pago / Pix creation
    transaction_id = f"PIX-{uuid.uuid4().hex[:12].upper()}"
    amount = 19.90 if request_data.plan_name == "PRO_MONTHLY" else 199.90
    
    # Fake Pix Payload
    pix_payload = f"00020101021126580014br.gov.bcb.pix0136{uuid.uuid4()}5204000053039865405{amount}5802BR5915Facilita PRO6009Sao Paulo62070503***6304ABCD"
    
    payment = Payment(
        user_id=user.id,
        transaction_id=transaction_id,
        amount=amount,
        method="PIX",
        status="pending"
    )
    db.add(payment)
    db.commit()
    
    return {
        "success": True,
        "transaction_id": transaction_id,
        "pix_qrcode_data": pix_payload,
        "amount": amount,
        "expires_in": 1800 # 30 min
    }

class WebhookRequest(BaseModel):
    transaction_id: str
    status: str

import os
WEBHOOK_SECRET_TOKEN = os.environ.get("WEBHOOK_SECRET_TOKEN", "")

@router.post("/webhook/mock")
def mock_payment_webhook(
    webhook_data: WebhookRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Mock endpoint para simular recebimento de webhook do Mercado Pago.
    Protegido por token de assinatura via header X-Webhook-Token.
    """
    # Verificação de assinatura/origem — rejeita se token não bater
    token = request.headers.get("X-Webhook-Token", "")
    if not WEBHOOK_SECRET_TOKEN or token != WEBHOOK_SECRET_TOKEN:
        raise HTTPException(
            status_code=403,
            detail="Token de webhook inválido ou não configurado. Defina WEBHOOK_SECRET_TOKEN no Render."
        )

    payment = db.query(Payment).filter(Payment.transaction_id == webhook_data.transaction_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    payment.status = webhook_data.status
    
    if payment.status == "approved":
        user = db.query(User).filter(User.id == payment.user_id).first()
        user.is_pro = True
        
        # Add subscription
        sub = Subscription(
            user_id=user.id,
            plan_name="PRO",
            status="active",
            valid_until=datetime.utcnow() + timedelta(days=30)
        )
        db.add(sub)
        
    db.commit()
    return {"success": True, "message": "Webhook processed"}
