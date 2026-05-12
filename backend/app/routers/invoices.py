import uuid
import tempfile
import os
from typing import List
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form
from sqlalchemy.orm import Session

from app import models, schemas, auth
from app.database import get_db
from app.parsers.base import BaseParser
from app.parsers.itau import ItauParser
from app.parsers.santander import SantanderParser
from app.parsers.bradesco import BradescoParser
from app.parsers.caixa import CaixaParser
from app.parsers.banks import SamsClubParser, SicrediParser, RiachueloParser

router = APIRouter()

PARSERS: List[BaseParser] = [
    ItauParser(),
    SantanderParser(),
    BradescoParser(),
    CaixaParser(),
    SamsClubParser(),
    SicrediParser(),
    RiachueloParser(),
]


def _detect_parser(text: str) -> BaseParser:
    for parser in PARSERS:
        if parser.detect(text):
            return parser
    raise HTTPException(422, detail="Banco não reconhecido. Certifique-se que o PDF é uma fatura de cartão de crédito.")


@router.post("/preview", response_model=schemas.InvoicePreview)
async def preview_invoice(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Upload PDF and get a preview of parsed transactions WITHOUT saving."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Somente arquivos PDF são aceitos.")

    content = await file.read()
    if len(content) > 25 * 1024 * 1024:  # 25 MB
        raise HTTPException(413, "Arquivo muito grande. Limite: 25 MB.")

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        parser = None
        # Try to extract text first to detect bank
        from pdfplumber import open as pdf_open
        text = ""
        with pdf_open(tmp_path) as pdf:
            for page in pdf.pages:
                text += (page.extract_text() or "") + "\n"

        parser = _detect_parser(text)
        transactions = parser.parse(text)

        return schemas.InvoicePreview(
            bank=parser.BANK_NAME,
            filename=file.filename,
            total_transactions=len(transactions),
            total_amount=round(sum(t.amount for t in transactions), 2),
            transactions=[schemas.ImportedTransaction(**t.to_dict()) for t in transactions],
        )
    finally:
        os.unlink(tmp_path)


@router.post("/confirm")
async def confirm_import(
    file: UploadFile = File(...),
    card_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    """Parse PDF and persist all transactions to the database."""
    content = await file.read()

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        from pdfplumber import open as pdf_open
        text = ""
        with pdf_open(tmp_path) as pdf:
            for page in pdf.pages:
                text += (page.extract_text() or "") + "\n"

        parser = _detect_parser(text)
        transactions = parser.parse(text)

        batch_id = str(uuid.uuid4())
        saved = 0
        errors = []

        for t in transactions:
            try:
                group_id = str(uuid.uuid4()) if t.installment_total and t.installment_total > 1 else None
                total = t.installment_total or 1
                start = t.installment_current or 1

                for i in range(start, total + 1):
                    from app.routers.transactions import _add_months
                    months_ahead = i - start
                    tx_date = _add_months(t.date, months_ahead)

                    tx = models.Transaction(
                        user_id=current_user.id,
                        type="D",
                        date=tx_date,
                        description=t.description,
                        supplier=t.supplier,
                        amount=round(t.amount, 2),
                        periodo_referencia=tx_date.strftime("%Y-%m"),
                        card_id=card_id,
                        installment_current=i if group_id else None,
                        installment_total=total if group_id else None,
                        installment_group=group_id,
                        source=parser.BANK_NAME.lower().replace(" ", "_"),
                        import_batch_id=batch_id,
                    )
                    db.add(tx)
                saved += 1
            except Exception as e:
                errors.append(str(e))

        # Log the import
        log = models.ImportLog(
            user_id=current_user.id,
            batch_id=batch_id,
            bank=parser.BANK_NAME,
            filename=file.filename,
            total_rows=len(transactions),
            imported_rows=saved,
            status="success" if not errors else "partial",
            error_detail="\n".join(errors) if errors else None,
        )
        db.add(log)
        db.commit()

        return {
            "batch_id": batch_id,
            "bank": parser.BANK_NAME,
            "imported": saved,
            "errors": len(errors),
            "status": "success" if not errors else "partial",
        }
    finally:
        os.unlink(tmp_path)


@router.get("/logs")
def import_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    logs = db.query(models.ImportLog).filter(
        models.ImportLog.user_id == current_user.id
    ).order_by(models.ImportLog.created_at.desc()).limit(20).all()
    return [
        {
            "id": l.id,
            "bank": l.bank,
            "filename": l.filename,
            "total_rows": l.total_rows,
            "imported_rows": l.imported_rows,
            "status": l.status,
            "created_at": str(l.created_at),
        }
        for l in logs
    ]
