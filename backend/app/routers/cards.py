from typing import List
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

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


@router.get("/invoice-status")
def list_invoice_status(
    period: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not period:
        period = date.today().strftime("%Y-%m")
    cards = db.query(models.Card).filter(
        models.Card.user_id == current_user.id,
        models.Card.is_active == True,
    ).all()
    result = []
    for c in cards:
        status = db.query(models.CardInvoiceStatus).filter(
            models.CardInvoiceStatus.user_id == current_user.id,
            models.CardInvoiceStatus.card_id == c.id,
            models.CardInvoiceStatus.period == period,
        ).first()
        total_spent = db.query(func.sum(models.Transaction.amount)).filter(
            models.Transaction.user_id == current_user.id,
            models.Transaction.card_id == c.id,
            models.Transaction.periodo_referencia == period,
            models.Transaction.type == "D",
        ).scalar() or 0.0

        result.append({
            "card_id": c.id,
            "card_name": c.name,
            "bank": c.bank,
            "due_day": c.due_day,
            "color": c.color,
            "credit_limit": c.credit_limit or 0.0,
            "total_spent": round(total_spent, 2),
            "available": round((c.credit_limit or 0.0) - total_spent, 2),
            "period": period,
            "paid": status.paid if status else False,
            "paid_at": status.paid_at.isoformat() if (status and status.paid_at) else None,
            "status_id": status.id if status else None,
        })
    return result


@router.post("/invoice-status/{card_id}")
def toggle_invoice_status(
    card_id: int,
    period: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not period:
        period = date.today().strftime("%Y-%m")
    card = db.query(models.Card).filter(
        models.Card.id == card_id,
        models.Card.user_id == current_user.id,
    ).first()
    if not card:
        raise HTTPException(404, "Cartão não encontrado")

    status = db.query(models.CardInvoiceStatus).filter(
        models.CardInvoiceStatus.user_id == current_user.id,
        models.CardInvoiceStatus.card_id == card_id,
        models.CardInvoiceStatus.period == period,
    ).first()

    if not status:
        status = models.CardInvoiceStatus(
            user_id=current_user.id,
            card_id=card_id,
            period=period,
            paid=True,
            paid_at=datetime.utcnow(),
        )
        db.add(status)
    else:
        status.paid = not status.paid
        status.paid_at = datetime.utcnow() if status.paid else None
    db.commit()
    return {"card_id": card_id, "period": period, "paid": status.paid}


@router.post("/check-due-alerts")
def check_due_alerts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    today = date.today()
    period = today.strftime("%Y-%m")
    cards_due = db.query(models.Card).filter(
        models.Card.user_id == current_user.id,
        models.Card.is_active == True,
        models.Card.due_day == today.day,
    ).all()

    if not cards_due:
        return {"sent": False, "reason": "no_cards_due"}

    unpaid = []
    for c in cards_due:
        status = db.query(models.CardInvoiceStatus).filter(
            models.CardInvoiceStatus.user_id == current_user.id,
            models.CardInvoiceStatus.card_id == c.id,
            models.CardInvoiceStatus.period == period,
        ).first()
        if status and status.paid:
            continue
        # avoid sending duplicate alert on same day
        if status and status.alerted_at and status.alerted_at.date() == today:
            continue
        unpaid.append({"name": c.name, "bank": c.bank, "due_day": c.due_day, "id": c.id})

    if not unpaid:
        return {"sent": False, "reason": "all_paid_or_alerted"}

    try:
        auth.send_due_alert_email(unpaid)
        # mark alerted_at for each
        for item in unpaid:
            status = db.query(models.CardInvoiceStatus).filter(
                models.CardInvoiceStatus.user_id == current_user.id,
                models.CardInvoiceStatus.card_id == item["id"],
                models.CardInvoiceStatus.period == period,
            ).first()
            if not status:
                status = models.CardInvoiceStatus(
                    user_id=current_user.id,
                    card_id=item["id"],
                    period=period,
                    paid=False,
                    alerted_at=datetime.utcnow(),
                )
                db.add(status)
            else:
                status.alerted_at = datetime.utcnow()
        db.commit()
        return {"sent": True, "cards": [c["name"] for c in unpaid]}
    except Exception as e:
        return {"sent": False, "reason": str(e)}


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
