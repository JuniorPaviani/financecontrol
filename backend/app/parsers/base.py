"""
Base class for all bank invoice parsers.
Each parser must implement: detect() and parse()
"""
import re
from abc import ABC, abstractmethod
from datetime import date
from typing import List, Optional, Tuple
import pdfplumber


class ParsedTransaction:
    def __init__(
        self,
        date: date,
        description: str,
        amount: float,
        supplier: Optional[str] = None,
        installment_current: Optional[int] = None,
        installment_total: Optional[int] = None,
    ):
        self.date = date
        self.description = description
        self.amount = amount
        self.supplier = supplier or self._extract_supplier(description)
        self.installment_current = installment_current
        self.installment_total = installment_total

    @staticmethod
    def _extract_supplier(desc: str) -> str:
        """Heuristic: take first meaningful word(s) of description."""
        clean = re.sub(r"[^A-Za-zÀ-ÿ\s]", " ", desc).strip()
        parts = clean.split()
        return " ".join(parts[:2]).title() if parts else desc[:30]

    def to_dict(self) -> dict:
        return {
            "date": self.date,
            "description": self.description,
            "supplier": self.supplier,
            "amount": self.amount,
            "installment_current": self.installment_current,
            "installment_total": self.installment_total,
            "category_guess": self._guess_category(),
        }

    def _guess_category(self) -> Optional[str]:
        """Simple keyword-based category guessing."""
        desc = self.description.lower()
        rules = [
            (["supermercado", "mercado", "extra", "carrefour", "pão de açúcar", "atacadão"], "Supermercado"),
            (["ifood", "uber eats", "rappi", "restaurante", "lanchonete", "pizzaria", "padaria"], "Alimentação"),
            (["uber", "99", "cabify", "combustível", "posto", "gasolina", "estacionamento"], "Transporte"),
            (["farmácia", "drogaria", "unimed", "bradesco saúde", "consulta", "médico"], "Saúde"),
            (["netflix", "spotify", "amazon prime", "disney", "hbo", "globoplay", "cinema"], "Lazer"),
            (["juros", "multa", "tarifa", "anuidade", "iof", "cet", "taxa"], "Financeiro"),
            (["claro", "vivo", "tim", "oi", "net", "cpfl", "celesc", "sabesp", "luz", "água"], "Habitação"),
            (["renner", "riachuelo", "c&a", "zara", "hering", "marisa", "lojas"], "Vestuário"),
            (["apple", "samsung", "notebook", "celular", "computador", "tv ", "eletro"], "Investimentos"),
            (["escola", "curso", "alura", "udemy", "livro", "livraria"], "Educação"),
        ]
        for keywords, cat in rules:
            if any(k in desc for k in keywords):
                return cat
        return None


class BaseParser(ABC):
    BANK_NAME: str = ""

    def extract_text(self, pdf_path: str) -> str:
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"
        return text

    @abstractmethod
    def detect(self, text: str) -> bool:
        """Return True if this parser can handle the given PDF text."""

    @abstractmethod
    def parse(self, text: str) -> List[ParsedTransaction]:
        """Extract list of transactions from the PDF text."""

    @staticmethod
    def parse_installment(token: str) -> Tuple[Optional[int], Optional[int]]:
        """Parse '02/10' → (2, 10).  Returns (None, None) if not a match."""
        m = re.search(r"(\d{1,2})/(\d{1,2})", token)
        if m:
            cur, tot = int(m.group(1)), int(m.group(2))
            if 1 <= cur <= tot <= 72:
                return cur, tot
        return None, None

    @staticmethod
    def parse_amount(token: str) -> Optional[float]:
        """Parse Brazilian-formatted amounts like '1.234,56' or '1234.56'."""
        token = token.replace(" ", "")
        # Remove currency symbol
        token = re.sub(r"[R$]", "", token).strip()
        # Brazilian format: 1.234,56
        if re.match(r"^\d{1,3}(\.\d{3})*,\d{2}$", token):
            return float(token.replace(".", "").replace(",", "."))
        # US format or plain decimal
        if re.match(r"^\d+(\.\d{1,2})?$", token):
            return float(token)
        return None

    @staticmethod
    def parse_date_br(token: str) -> Optional[date]:
        """Parse DD/MM or DD/MM/YYYY → date (uses current year if no year)."""
        from datetime import date as Date
        m = re.match(r"(\d{2})/(\d{2})(?:/(\d{2,4}))?", token)
        if not m:
            return None
        day, month = int(m.group(1)), int(m.group(2))
        year = int(m.group(3)) if m.group(3) else Date.today().year
        if len(str(year)) == 2:
            year += 2000
        try:
            return Date(year, month, day)
        except ValueError:
            return None
