from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db

router = APIRouter()


@router.get("/summary", response_model=List[schemas.MonthSummary])
def monthly_summary(
    months: int = Query(6, le=24),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    rows = (
        db.query(
            models.Transaction.periodo_referencia,
            models.Transaction.type,
            func.sum(models.Transaction.amount).label("total"),
        )
        .filter(models.Transaction.user_id == current_user.id)
        .group_by(models.Transaction.periodo_referencia, models.Transaction.type)
        .order_by(models.Transaction.periodo_referencia.desc())
        .limit(months * 2)
        .all()
    )

    # Aggregate by period
    periods: dict = {}
    for row in rows:
        p = row.periodo_referencia
        if p not in periods:
            periods[p] = {"periodo_referencia": p, "total_receitas": 0, "total_despesas": 0}
        if row.type == "R":
            periods[p]["total_receitas"] = round(row.total, 2)
        else:
            periods[p]["total_despesas"] = round(row.total, 2)

    result = []
    for p, d in sorted(periods.items(), reverse=True):
        d["saldo"] = round(d["total_receitas"] - d["total_despesas"], 2)
        result.append(schemas.MonthSummary(**d))
    return result


@router.get("/comparative")
def comparative(
    current_periodo: str = Query(..., description="YYYY-MM"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Compare current month vs previous month, broken down by IFRS category."""

    def _get_summary(periodo: str):
        rows = (
            db.query(
                models.Transaction.type,
                func.sum(models.Transaction.amount).label("total"),
            )
            .filter(
                models.Transaction.user_id == current_user.id,
                models.Transaction.periodo_referencia == periodo,
            )
            .group_by(models.Transaction.type)
            .all()
        )
        rec = sum(r.total for r in rows if r.type == "R")
        des = sum(r.total for r in rows if r.type == "D")
        return {"periodo_referencia": periodo, "total_receitas": round(rec, 2),
                "total_despesas": round(des, 2), "saldo": round(rec - des, 2)}

    def _prev(periodo: str) -> str:
        y, m = int(periodo[:4]), int(periodo[5:])
        m -= 1
        if m == 0:
            m, y = 12, y - 1
        return f"{y:04d}-{m:02d}"

    prev_periodo = _prev(current_periodo)
    current_data = _get_summary(current_periodo)
    previous_data = _get_summary(prev_periodo)

    var = 0.0
    if previous_data["total_despesas"] > 0:
        var = ((current_data["total_despesas"] - previous_data["total_despesas"]) /
               previous_data["total_despesas"]) * 100

    # By category
    cat_rows = (
        db.query(
            models.Category.name,
            models.Category.ifrs_group,
            models.Transaction.periodo_referencia,
            func.sum(models.Transaction.amount).label("total"),
        )
        .join(models.Transaction, models.Transaction.category_id == models.Category.id)
        .filter(
            models.Transaction.user_id == current_user.id,
            models.Transaction.type == "D",
            models.Transaction.periodo_referencia.in_([current_periodo, prev_periodo]),
        )
        .group_by(models.Category.name, models.Category.ifrs_group, models.Transaction.periodo_referencia)
        .all()
    )

    cat_map: dict = {}
    for row in cat_rows:
        if row.name not in cat_map:
            cat_map[row.name] = {"name": row.name, "ifrs": row.ifrs_group, "current": 0, "previous": 0}
        if row.periodo_referencia == current_periodo:
            cat_map[row.name]["current"] = round(row.total, 2)
        else:
            cat_map[row.name]["previous"] = round(row.total, 2)

    return {
        "current": current_data,
        "previous": previous_data,
        "variation_pct": round(var, 2),
        "by_category": list(cat_map.values()),
    }


@router.get("/by-card")
def by_card(
    periodo: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    q = (
        db.query(
            models.Card.name,
            models.Card.bank,
            func.sum(models.Transaction.amount).label("total"),
            func.count(models.Transaction.id).label("count"),
        )
        .join(models.Transaction, models.Transaction.card_id == models.Card.id)
        .filter(
            models.Transaction.user_id == current_user.id,
            models.Transaction.type == "D",
        )
    )
    if periodo:
        q = q.filter(models.Transaction.periodo_referencia == periodo)
    q = q.group_by(models.Card.name, models.Card.bank).all()
    return [{"card": r.name, "bank": r.bank, "total": round(r.total, 2), "count": r.count} for r in q]


@router.get("/installments-projection")
def installments_projection(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    rows = (
        db.query(
            models.Transaction.installment_group,
            models.Transaction.description,
            models.Transaction.amount,
            func.count(models.Transaction.id).label("remaining"),
            func.min(models.Transaction.date).label("next_date"),
        )
        .filter(
            models.Transaction.user_id == current_user.id,
            models.Transaction.installment_group.isnot(None),
            models.Transaction.type == "D",
        )
        .group_by(
            models.Transaction.installment_group,
            models.Transaction.description,
            models.Transaction.amount,
        )
        .all()
    )
    return [
        {
            "description": r.description,
            "monthly_amount": round(r.amount, 2),
            "remaining": r.remaining,
            "next_date": str(r.next_date),
            "total_committed": round(r.amount * r.remaining, 2),
        }
        for r in rows
    ]
