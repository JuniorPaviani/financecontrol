import os
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter()


@router.post("/register", response_model=schemas.Token, status_code=201)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == data.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    user = models.User(
        name=data.name,
        email=data.email,
        hashed_password=auth.hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Seed default categories for new user
    _seed_categories(user.id, db)

    token = auth.create_token(user.id, user.email)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=schemas.Token)
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    if not user or not auth.verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = auth.create_token(user.id, user.email)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@router.post("/forgot-password")
def forgot_password(data: schemas.ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    # Always return the same message to avoid leaking whether the e-mail exists
    msg = {"message": "Se o e-mail estiver cadastrado, você receberá as instruções em breve."}
    if not user:
        return msg

    # Invalidate any previous unused tokens for this user
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id,
        models.PasswordResetToken.used == False,
    ).update({"used": True})

    token_str  = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)
    db.add(models.PasswordResetToken(user_id=user.id, token=token_str, expires_at=expires_at))
    db.commit()

    frontend_url = os.getenv("FRONTEND_URL", "https://financecontrol-kiyl.onrender.com")
    reset_url    = f"{frontend_url}/?reset_token={token_str}"

    try:
        auth.send_reset_email(user.email, user.name, reset_url)
    except Exception as e:
        raise HTTPException(500, detail=f"Erro ao enviar e-mail: {str(e)}")

    return msg


@router.post("/reset-password")
def reset_password(data: schemas.ResetPassword, db: Session = Depends(get_db)):
    if len(data.new_password) < 6:
        raise HTTPException(400, detail="A senha deve ter pelo menos 6 caracteres.")

    token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == data.token,
        models.PasswordResetToken.used  == False,
    ).first()

    if not token or token.expires_at < datetime.utcnow():
        raise HTTPException(400, detail="Link inválido ou expirado. Solicite um novo.")

    user = db.query(models.User).filter(models.User.id == token.user_id).first()
    if not user:
        raise HTTPException(400, detail="Usuário não encontrado.")

    user.hashed_password = auth.hash_password(data.new_password)
    token.used = True
    db.commit()

    return {"message": "Senha redefinida com sucesso!"}


def _seed_categories(user_id: int, db: Session):
    defaults = [
        # Custos Operacionais
        ("Insumos",                    "Custos Operacionais",      "📦", "#F97316"),
        ("Produtos de Limpeza/Higiene","Custos Operacionais",      "🧹", "#06B6D4"),
        ("Embalagem",                  "Custos Operacionais",      "🗂️", "#F59E0B"),
        ("Material de Uso Geral",      "Custos Operacionais",      "🔧", "#78716C"),
        # Despesas Administrativas
        ("Salários",                   "Despesas Administrativas", "👥", "#8B5CF6"),
        ("Impostos",                   "Despesas Administrativas", "📋", "#EF4444"),
        ("Aluguel",                    "Despesas Administrativas", "🏠", "#6366F1"),
        ("Energia",                    "Despesas Administrativas", "⚡", "#EAB308"),
        ("Internet",                   "Despesas Administrativas", "🌐", "#10B981"),
        ("Água",                       "Despesas Administrativas", "💧", "#2563EB"),
    ]
    for name, ifrs, icon, color in defaults:
        db.add(models.Category(user_id=user_id, name=name, ifrs_group=ifrs, icon=icon, color=color))
    db.commit()
