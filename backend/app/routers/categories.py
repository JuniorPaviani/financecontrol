from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter()


@router.get("", response_model=List[schemas.CategoryOut])
def list_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return db.query(models.Category).filter(models.Category.user_id == current_user.id).all()


@router.post("", response_model=schemas.CategoryOut, status_code=201)
def create_category(
    data: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    cat = models.Category(**data.model_dump(), user_id=current_user.id)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/{cat_id}", response_model=schemas.CategoryOut)
def update_category(
    cat_id: int,
    data: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    cat = db.query(models.Category).filter(
        models.Category.id == cat_id, models.Category.user_id == current_user.id
    ).first()
    if not cat:
        raise HTTPException(404, "Categoria não encontrada")
    for k, v in data.model_dump().items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{cat_id}", status_code=204)
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    cat = db.query(models.Category).filter(
        models.Category.id == cat_id, models.Category.user_id == current_user.id
    ).first()
    if not cat:
        raise HTTPException(404, "Categoria não encontrada")
    db.delete(cat)
    db.commit()
