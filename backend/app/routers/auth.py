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


def _seed_categories(user_id: int, db: Session):
    defaults = [
        ("Alimentação",    "Custos Operacionais",      "🍽️", "#F97316"),
        ("Transporte",     "Custos Operacionais",      "🚗", "#2563EB"),
        ("Saúde",          "Despesas Administrativas", "💊", "#10B981"),
        ("Habitação",      "Despesas Administrativas", "🏠", "#8B5CF6"),
        ("Lazer",          "Custos Operacionais",      "🎬", "#F59E0B"),
        ("Vestuário",      "Custos Operacionais",      "👕", "#06B6D4"),
        ("Financeiro",     "Despesas Financeiras",     "💳", "#EF4444"),
        ("Investimentos",  "Investimentos (Ativos)",   "📈", "#10B981"),
        ("Educação",       "Despesas Administrativas", "📚", "#A78BFA"),
        ("Supermercado",   "Custos Operacionais",      "🛒", "#EC4899"),
        ("Streaming",      "Custos Operacionais",      "📺", "#6366F1"),
        ("Combustível",    "Custos Operacionais",      "⛽", "#78716C"),
    ]
    for name, ifrs, icon, color in defaults:
        db.add(models.Category(user_id=user_id, name=name, ifrs_group=ifrs, icon=icon, color=color))
    db.commit()
