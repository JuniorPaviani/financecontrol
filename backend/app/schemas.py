from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import date


# ── Auth ──────────────────────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ── Category ──────────────────────────────────────────────────────────────────
class CategoryCreate(BaseModel):
    name: str
    ifrs_group: str
    icon: Optional[str] = "💰"
    color: Optional[str] = "#2563EB"


class CategoryOut(CategoryCreate):
    id: int
    model_config = {"from_attributes": True}


# ── Card ──────────────────────────────────────────────────────────────────────
class CardCreate(BaseModel):
    name: str
    bank: str
    last_four: Optional[str] = None
    credit_limit: Optional[float] = 0.0
    closing_day: Optional[int] = None
    due_day: Optional[int] = None
    color: Optional[str] = "#2563EB"


class CardOut(CardCreate):
    id: int
    is_active: bool
    model_config = {"from_attributes": True}


# ── Transaction ───────────────────────────────────────────────────────────────
class TransactionCreate(BaseModel):
    type: str                           # D | R
    date: date
    description: str
    supplier: Optional[str] = None
    amount: float
    category_id: Optional[int] = None
    card_id: Optional[int] = None
    installment_current: Optional[int] = None
    installment_total: Optional[int] = None
    notes: Optional[str] = None

    @field_validator("type")
    @classmethod
    def validate_type(cls, v):
        if v not in ("D", "R"):
            raise ValueError("type must be D or R")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError("amount must be positive")
        return round(v, 2)


class TransactionOut(BaseModel):
    id: int
    type: str
    date: date
    description: str
    supplier: Optional[str]
    amount: float
    periodo_referencia: str
    installment_current: Optional[int]
    installment_total: Optional[int]
    installment_group: Optional[str]
    source: str
    notes: Optional[str]
    category: Optional[CategoryOut]
    card: Optional[CardOut]
    model_config = {"from_attributes": True}


# ── Reports ───────────────────────────────────────────────────────────────────
class MonthSummary(BaseModel):
    periodo_referencia: str
    total_receitas: float
    total_despesas: float
    saldo: float


class CategorySummary(BaseModel):
    category_name: str
    ifrs_group: str
    total: float
    pct: float


class ComparativeReport(BaseModel):
    current: MonthSummary
    previous: MonthSummary
    variation_pct: float
    by_category: List[CategorySummary]


# ── Invoice Import ─────────────────────────────────────────────────────────────
class ImportedTransaction(BaseModel):
    date: date
    description: str
    supplier: Optional[str]
    amount: float
    installment_current: Optional[int]
    installment_total: Optional[int]
    category_guess: Optional[str]


class InvoicePreview(BaseModel):
    bank: str
    filename: str
    total_transactions: int
    total_amount: float
    transactions: List[ImportedTransaction]
