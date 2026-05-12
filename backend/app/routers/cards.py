from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter()


@router.get("", response_model=List[schemas.CardOut])
def list_cards(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return db.query(models.Card).filter(
        models.Card.user_id == current_user.id,
        models.Card.is_active == True
    ).all()


@router.post("", response_model=schemas.CardOut, status_code=201)
def create_card(
    data: schemas.CardCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    card = models.Card(**data.model_dump(), user_id=current_user.id)
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.put("/{card_id}", response_model=schemas.CardOut)
def update_card(
    card_id: int,
    data: schemas.CardCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    card = db.query(models.Card).filter(
        models.Card.id == card_id, models.Card.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(404, "Cartão não encontrado")
    for k, v in data.model_dump().items():
        setattr(card, k, v)
    db.commit()
    db.refresh(card)
    return card


@router.delete("/{card_id}", status_code=204)
def delete_card(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    card = db.query(models.Card).filter(
        models.Card.id == card_id, models.Card.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(404, "Cartão não encontrado")
    card.is_active = False
    db.commit()
