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

import os
import mercadopago

MP_ACCESS_TOKEN = os.environ.get("MP_ACCESS_TOKEN", "")

@router.post("/pix/generate")
def generate_pix(request_data: PixRequest, request: Request, db: Session = Depends(get_db)):
    if not request.state.is_authenticated:
        raise HTTPException(status_code=401, detail="Você precisa estar logado para assinar.")
        
    user_email = request.state.user_email
    user = db.query(User).filter(User.email == user_email).first()
    
    amount = 19.90 if request_data.plan_name == "PRO_MONTHLY" else 199.90
    transaction_id = f"PIX-{uuid.uuid4().hex[:12].upper()}"

    pix_payload = ""
    pix_base64 = ""
    external_id = transaction_id

    if MP_ACCESS_TOKEN:
        # Integração Real com Mercado Pago
        sdk = mercadopago.SDK(MP_ACCESS_TOKEN)
        payment_data = {
            "transaction_amount": float(amount),
            "description": f"Facilita PRO - {request_data.plan_name}",
            "payment_method_id": "pix",
            "payer": {
                "email": user_email,
                "first_name": user.name.split()[0] if user.name else "Usuário"
            },
            "external_reference": transaction_id
        }
        
        try:
            result = sdk.payment().create(payment_data)
            payment_info = result["response"]
            
            if "point_of_interaction" in payment_info:
                pix_data = payment_info["point_of_interaction"]["transaction_data"]
                pix_payload = pix_data["qr_code"]
                pix_base64 = pix_data.get("qr_code_base64", "")
                external_id = str(payment_info["id"])
            else:
                raise Exception("Erro ao gerar PIX no Mercado Pago.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Falha no gateway de pagamento: {str(e)}")
    else:
        # Mocking Mercado Pago / Pix creation (Fallback para dev)
        pix_payload = f"00020101021126580014br.gov.bcb.pix0136{uuid.uuid4()}5204000053039865405{amount}5802BR5915Facilita PRO6009Sao Paulo62070503***6304ABCD"
        try:
            import qrcode
            import io
            import base64
            img = qrcode.make(pix_payload)
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            pix_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        except ImportError:
            pix_base64 = ""
    
    payment = Payment(
        user_id=user.id,
        transaction_id=external_id, # Salva o ID real do MP se for prod, ou o mock se for dev
        amount=amount,
        method="PIX",
        status="pending"
    )
    db.add(payment)
    db.commit()
    
    return {
        "success": True,
        "transaction_id": external_id,
        "pix_qrcode_data": pix_payload,
        "pix_base64": pix_base64,
        "amount": amount,
        "expires_in": 1800 # 30 min
    }

@router.get("/{transaction_id}/status")
def get_payment_status(transaction_id: str, request: Request, db: Session = Depends(get_db)):
    if not request.state.is_authenticated:
        raise HTTPException(status_code=401, detail="Não autorizado")
    
    payment = db.query(Payment).filter(Payment.transaction_id == transaction_id, Payment.user_id == db.query(User).filter(User.email == request.state.user_email).first().id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
        
    return {
        "status": payment.status # pending, approved, rejected
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
    # Verificação de assinatura/origem — rejeita se token não bater (apenas se configurado em Prod)
    token = request.headers.get("X-Webhook-Token", "")
    if WEBHOOK_SECRET_TOKEN and token != WEBHOOK_SECRET_TOKEN:
        raise HTTPException(
            status_code=403,
            detail="Token de webhook inválido."
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

@router.post("/webhook/mercadopago")
async def mercadopago_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Webhook oficial para receber atualizações do Mercado Pago.
    O MP envia { "action": "payment.updated", "data": { "id": "123456" } }
    """
    data = await request.json()
    
    # Verifica se é um evento de pagamento
    if data.get("action") and "payment" in data.get("action"):
        payment_id = data.get("data", {}).get("id")
        if not payment_id:
            return {"success": True}
            
        if not MP_ACCESS_TOKEN:
            raise HTTPException(status_code=500, detail="MP_ACCESS_TOKEN não configurado")
            
        # Consulta o status real no Mercado Pago
        sdk = mercadopago.SDK(MP_ACCESS_TOKEN)
        payment_info = sdk.payment().get(payment_id)
        
        if payment_info["status"] == 200:
            payment_data = payment_info["response"]
            external_reference = payment_data.get("external_reference")
            status = payment_data.get("status") # 'approved', 'pending', etc.
            
            # Atualiza no banco
            payment = db.query(Payment).filter(Payment.transaction_id == external_reference).first()
            if payment and status == "approved" and payment.status != "approved":
                payment.status = "approved"
                
                # Ativa o plano PRO
                user = db.query(User).filter(User.id == payment.user_id).first()
                if user:
                    user.is_pro = True
                    sub = Subscription(
                        user_id=user.id,
                        plan_name="PRO",
                        status="active",
                        valid_until=datetime.utcnow() + timedelta(days=30)
                    )
                    db.add(sub)
                db.commit()
                
    return {"success": True}
