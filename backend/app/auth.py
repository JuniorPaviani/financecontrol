import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app import models

SECRET_KEY  = os.getenv("SECRET_KEY", "CHANGE_ME_IN_PRODUCTION_USE_STRONG_KEY")
ALGORITHM   = "HS256"
TOKEN_EXPIRE_HOURS = int(os.getenv("TOKEN_EXPIRE_HOURS", 24))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer      = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: int, email: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
    return jwt.encode(
        {"sub": str(user_id), "email": email, "exp": expire},
        SECRET_KEY, algorithm=ALGORITHM
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> models.User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado")

    user = db.query(models.User).filter(models.User.id == user_id, models.User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado")
    return user


def require_admin(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a administradores")
    return current_user


def send_reset_email(to_email: str, to_name: str, reset_url: str) -> None:
    import smtplib, ssl
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")

    if not smtp_user or not smtp_pass:
        raise ValueError("Variáveis SMTP_USER e SMTP_PASS não configuradas no servidor.")

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#0D0805;color:#F5E6D3;margin:0;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:28px;">
      <h1 style="color:#9B2335;font-size:22px;margin:0 0 4px;letter-spacing:-0.02em;">FinanceControl</h1>
      <p style="color:#9E826A;font-size:11px;margin:0;text-transform:uppercase;letter-spacing:0.08em;">Gestão Financeira · IFRS</p>
    </div>
    <div style="background:#140D07;border:1px solid #3D2415;border-radius:12px;padding:32px;">
      <h2 style="color:#F5E6D3;font-size:17px;margin:0 0 14px;font-weight:700;">Redefinição de Senha</h2>
      <p style="color:#9E826A;font-size:14px;line-height:1.65;margin:0 0 24px;">
        Olá, <strong style="color:#F5E6D3;">{to_name}</strong>!<br><br>
        Recebemos uma solicitação para redefinir a senha da sua conta.
        Clique no botão abaixo para criar uma nova senha:
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="{reset_url}" style="display:inline-block;background:#9B2335;color:#ffffff;
           text-decoration:none;padding:14px 36px;border-radius:8px;font-size:14px;
           font-weight:600;letter-spacing:0.02em;box-shadow:0 4px 14px rgba(155,35,53,0.4);">
          Redefinir Senha
        </a>
      </div>
      <p style="color:#5A3D28;font-size:12px;margin:0 0 6px;">
        ⏱ Este link expira em <strong style="color:#9E826A;">1 hora</strong>.
      </p>
      <p style="color:#5A3D28;font-size:12px;margin:0;">
        🔒 Se você não solicitou a redefinição, ignore este e-mail. Sua senha permanece a mesma.
      </p>
    </div>
    <p style="text-align:center;color:#5A3D28;font-size:11px;margin-top:20px;">
      FinanceControl · Rotas Café
    </p>
  </div>
</body></html>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Redefinição de Senha — FinanceControl"
    msg["From"]    = f"FinanceControl <{smtp_user}>"
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html", "utf-8"))

    context = ssl.create_default_context()
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.ehlo()
        server.starttls(context=context)
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, to_email, msg.as_string())


def send_due_alert_email(cards_due: list) -> None:
    import smtplib, ssl
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    alert_email = os.getenv("ALERT_EMAIL", "REDACTED_EMAIL")

    if not smtp_user or not smtp_pass:
        raise ValueError("SMTP não configurado.")

    rows = "".join(
        f"<tr><td style='padding:8px 12px;color:#F5E6D3;'>{c['name']}</td>"
        f"<td style='padding:8px 12px;color:#9E826A;'>{c['bank']}</td>"
        f"<td style='padding:8px 12px;color:#E8A87C;font-weight:700;'>Dia {c['due_day']}</td></tr>"
        for c in cards_due
    )

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#0D0805;color:#F5E6D3;margin:0;padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:28px;">
      <h1 style="color:#9B2335;font-size:22px;margin:0 0 4px;">FinanceControl</h1>
      <p style="color:#9E826A;font-size:11px;margin:0;text-transform:uppercase;letter-spacing:0.08em;">Gestão Financeira · IFRS</p>
    </div>
    <div style="background:#140D07;border:1px solid #3D2415;border-radius:12px;padding:32px;">
      <h2 style="color:#E8A87C;font-size:17px;margin:0 0 8px;">⚠️ Vencimento de Fatura Hoje</h2>
      <p style="color:#9E826A;font-size:14px;line-height:1.65;margin:0 0 20px;">
        Os seguintes cartões vencem <strong style="color:#F5E6D3;">hoje</strong> e ainda não tiveram a fatura marcada como paga:
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #3D2415;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#1E100A;">
            <th style="padding:10px 12px;text-align:left;color:#9E826A;font-size:11px;text-transform:uppercase;">Cartão</th>
            <th style="padding:10px 12px;text-align:left;color:#9E826A;font-size:11px;text-transform:uppercase;">Banco</th>
            <th style="padding:10px 12px;text-align:left;color:#9E826A;font-size:11px;text-transform:uppercase;">Vencimento</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      <div style="margin-top:24px;text-align:center;">
        <a href="https://financecontrol-kiyl.onrender.com" style="display:inline-block;background:#9B2335;color:#fff;
           text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">
          Acessar Sistema
        </a>
      </div>
    </div>
    <p style="text-align:center;color:#5A3D28;font-size:11px;margin-top:20px;">FinanceControl · Rotas Café</p>
  </div>
</body></html>"""

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"⚠️ Vencimento de Fatura Hoje — {len(cards_due)} cartão(ns)"
    msg["From"]    = f"FinanceControl <{smtp_user}>"
    msg["To"]      = alert_email
    msg.attach(MIMEText(html, "html", "utf-8"))

    context = ssl.create_default_context()
    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.ehlo()
        server.starttls(context=context)
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, alert_email, msg.as_string())
