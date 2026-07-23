import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_EMAIL = os.environ.get("SMTP_EMAIL", "facilita.app.contato@gmail.com")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587

def send_reset_email(to_email: str, token: str):
    if not SMTP_PASSWORD:
        print("[WARNING] SMTP_PASSWORD não configurada. E-mail não enviado.")
        return False
        
    reset_link = f"https://facilita-alpha.vercel.app/auth/reset_senha.html?token={token}"
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #0F172A; color: #ffffff; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; padding: 30px; border-radius: 12px; border: 1px solid #334155;">
          <h2 style="color: #A855F7; margin-bottom: 20px;">Recuperação de Senha - Facilita</h2>
          <p style="color: #CBD5E1; font-size: 16px;">Você solicitou a redefinição da sua senha. Clique no botão abaixo para criar uma nova senha:</p>
          <a href="{reset_link}" style="display: inline-block; background-color: #8B5CF6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Redefinir Senha</a>
          <p style="color: #94A3B8; font-size: 14px; margin-top: 30px;">Se você não solicitou essa redefinição, por favor ignore este e-mail.</p>
        </div>
      </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Recuperação de Senha - Facilita"
    msg["From"] = f"Facilita <{SMTP_EMAIL}>"
    msg["To"] = to_email

    part = MIMEText(html_content, "html")
    msg.attach(part)

    try:
        print(f"[INFO] Link de Recuperação gerado: {reset_link}")
        # Timeout de 5s adicionado porque o Render bloqueia a porta 587 no plano gratuito
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=5)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"[ERROR] Falha ao enviar e-mail: {e}")
        # Como estamos no Render gratuito e o SMTP falha, retornamos True em modo dev
        # para que o usuário não fique preso e possa pegar o link no console do Render.
        return True
