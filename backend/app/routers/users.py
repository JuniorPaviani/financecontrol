from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter()


@router.get("/", response_model=List[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    return db.query(models.User).order_by(models.User.name).all()


@router.patch("/{user_id}", response_model=schemas.UserOut)
def update_user_permissions(
    user_id: int,
    payload: schemas.UserPermissionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    if user_id == current_user.id:
        raise HTTPException(400, "Não é possível alterar suas próprias permissões")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuário não encontrado")
    if payload.role is not None:
        if payload.role not in ("admin", "user"):
            raise HTTPException(400, "Role deve ser 'admin' ou 'user'")
        user.role = payload.role
    if payload.can_view_reports is not None:
        user.can_view_reports = payload.can_view_reports
    if payload.can_view_receitas is not None:
        user.can_view_receitas = payload.can_view_receitas
    if payload.is_active is not None:
        user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    if user_id == current_user.id:
        raise HTTPException(400, "Não é possível excluir sua própria conta")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuário não encontrado")
    db.delete(user)
    db.commit()
