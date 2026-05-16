import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter()


def _periodo(d: date) -> str:
    return d.strftime("%Y-%m")


@router.get("", response_model=List[schemas.TransactionOut])
def list_transactions(
    periodo: Optional[str] = Query(None, description="YYYY-MM"),
    type: Optional[str] = Query(None),
    card_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = db.query(models.Transaction).filter(models.Transaction.user_id == current_user.id)
    can_receita = current_user.role == "admin" or current_user.can_view_receitas
    if not can_receita:
        q = q.filter(models.Transaction.type != "R")
    if periodo:
        q = q.filter(models.Transaction.periodo_referencia == periodo)
    if type:
        q = q.filter(models.Transaction.type == type)
    if card_id:
        q = q.filter(models.Transaction.card_id == card_id)
    if category_id:
        q = q.filter(models.Transaction.category_id == category_id)
    if search:
        like = f"%{search}%"
        q = q.filter(
            models.Transaction.description.ilike(like) |
            models.Transaction.supplier.ilike(like)
        )
    return q.order_by(models.Transaction.date.desc()).all()


@router.post("", response_model=schemas.TransactionOut, status_code=201)
def create_transaction(
    data: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if data.type == "R" and current_user.role != "admin" and not current_user.can_view_receitas:
        raise HTTPException(status_code=403, detail="Sem permissão para registrar receitas")
    group_id = str(uuid.uuid4()) if data.installment_total and data.installment_total > 1 else None
    created = []

    total = data.installment_total or 1
    start = data.installment_current or 1

    for i in range(start, total + 1):
        # Calculate date for each installment (advance by months)
        months_ahead = i - start
        tx_date = _add_months(data.date, months_ahead)

        pm = (data.payment_method or "cartao").lower()
        auto_paid = pm in ("pix", "dinheiro")
        tx = models.Transaction(
            user_id=current_user.id,
            type=data.type,
            date=tx_date,
            description=data.description,
            supplier=data.supplier,
            amount=round(data.amount, 2),
            periodo_referencia=_periodo(tx_date),
            category_id=data.category_id,
            card_id=data.card_id if pm == "cartao" else None,
            installment_current=i if group_id else None,
            installment_total=total if group_id else None,
            installment_group=group_id,
            source="manual",
            notes=data.notes,
            payment_method=pm,
            paid=auto_paid,
        )
        db.add(tx)
        created.append(tx)

    db.commit()
    db.refresh(created[0])
    return created[0]


@router.get("/{tx_id}", response_model=schemas.TransactionOut)
def get_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    tx = db.query(models.Transaction).filter(
        models.Transaction.id == tx_id,
        models.Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(404, "Transação não encontrada")
    return tx


@router.delete("/{tx_id}", status_code=204)
def delete_transaction(
    tx_id: int,
    all_installments: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    tx = db.query(models.Transaction).filter(
        models.Transaction.id == tx_id,
        models.Transaction.user_id == current_user.id
    ).first()
    if not tx:
        raise HTTPException(404, "Transação não encontrada")

    if all_installments and tx.installment_group:
        db.query(models.Transaction).filter(
            models.Transaction.installment_group == tx.installment_group,
            models.Transaction.user_id == current_user.id
        ).delete()
    else:
        db.delete(tx)
    db.commit()


def _add_months(d: date, months: int) -> date:
    month = d.month - 1 + months
    year = d.year + month // 12
    month = month % 12 + 1
    import calendar
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)
