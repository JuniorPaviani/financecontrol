from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Boolean, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(120), nullable=False)
    email           = Column(String(180), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    is_active             = Column(Boolean, default=True)
    role                  = Column(String(20), default="admin")  # admin | user
    can_view_reports      = Column(Boolean, default=False)
    can_view_receitas     = Column(Boolean, default=False)
    force_password_change = Column(Boolean, default=False)
    created_at            = Column(DateTime, server_default=func.now())

    transactions    = relationship("Transaction", back_populates="user", cascade="all, delete")
    cards           = relationship("Card", back_populates="user", cascade="all, delete")
    categories      = relationship("Category", back_populates="user", cascade="all, delete")
    employees       = relationship("Employee", back_populates="user", cascade="all, delete")
    salary_payments = relationship("SalaryPayment", back_populates="user", cascade="all, delete")


class Category(Base):
    __tablename__ = "categories"
    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    name          = Column(String(80), nullable=False)
    ifrs_group    = Column(String(80), nullable=False)
    icon          = Column(String(10), default="💰")
    color         = Column(String(10), default="#2563EB")
    user          = relationship("User", back_populates="categories")
    transactions  = relationship("Transaction", back_populates="category")


class Card(Base):
    __tablename__ = "cards"
    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    name          = Column(String(80), nullable=False)
    bank          = Column(String(60), nullable=False)
    last_four     = Column(String(4), nullable=True)
    credit_limit  = Column(Float, default=0.0)
    closing_day   = Column(Integer, nullable=True)
    due_day       = Column(Integer, nullable=True)
    color         = Column(String(10), default="#2563EB")
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, server_default=func.now())
    user          = relationship("User", back_populates="cards")
    transactions  = relationship("Transaction", back_populates="card")


class Transaction(Base):
    __tablename__ = "transactions"
    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id     = Column(Integer, ForeignKey("categories.id"), nullable=True)
    card_id         = Column(Integer, ForeignKey("cards.id"), nullable=True)
    type            = Column(String(1), nullable=False)
    date            = Column(Date, nullable=False)
    description     = Column(String(255), nullable=False)
    supplier        = Column(String(120), nullable=True)
    amount          = Column(Float, nullable=False)
    periodo_referencia = Column(String(7), nullable=False)
    installment_current = Column(Integer, nullable=True)
    installment_total   = Column(Integer, nullable=True)
    installment_group   = Column(String(36), nullable=True)
    source          = Column(String(40), default="manual")
    import_batch_id = Column(String(36), nullable=True)
    notes           = Column(Text, nullable=True)
    payment_method  = Column(String(20), default="cartao")   # cartao | pix | dinheiro | boleto
    paid            = Column(Boolean, default=False)          # baixado automaticamente para pix/dinheiro
    created_at      = Column(DateTime, server_default=func.now())
    user            = relationship("User", back_populates="transactions")
    category        = relationship("Category", back_populates="transactions")
    card            = relationship("Card", back_populates="transactions")


class ImportLog(Base):
    __tablename__ = "import_logs"
    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    batch_id        = Column(String(36), nullable=False)
    bank            = Column(String(60), nullable=False)
    filename        = Column(String(255), nullable=True)
    total_rows      = Column(Integer, default=0)
    imported_rows   = Column(Integer, default=0)
    status          = Column(String(20), default="success")
    error_detail    = Column(Text, nullable=True)
    created_at      = Column(DateTime, server_default=func.now())


class Employee(Base):
    __tablename__ = "employees"
    id             = Column(Integer, primary_key=True, index=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    name           = Column(String(120), nullable=False)
    cpf            = Column(String(14), nullable=True)
    position       = Column(String(80), nullable=True)
    department     = Column(String(80), nullable=True)
    base_salary    = Column(Float, default=0.0)
    hire_date      = Column(Date, nullable=True)
    status         = Column(String(20), default="active")
    notes          = Column(Text, nullable=True)
    created_at     = Column(DateTime, server_default=func.now())
    user            = relationship("User", back_populates="employees")
    salary_payments = relationship("SalaryPayment", back_populates="employee", cascade="all, delete-orphan")


class CardInvoiceStatus(Base):
    __tablename__ = "card_invoice_status"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    card_id    = Column(Integer, ForeignKey("cards.id"), nullable=False)
    period     = Column(String(7), nullable=False)   # YYYY-MM
    paid       = Column(Boolean, default=False)
    paid_at    = Column(DateTime, nullable=True)
    alerted_at = Column(DateTime, nullable=True)     # último e-mail enviado
    user       = relationship("User")
    card       = relationship("Card")


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    token      = Column(String(64), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used       = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    user       = relationship("User")


class SalaryPayment(Base):
    __tablename__ = "salary_payments"
    id                 = Column(Integer, primary_key=True, index=True)
    employee_id        = Column(Integer, ForeignKey("employees.id"), nullable=False)
    user_id            = Column(Integer, ForeignKey("users.id"), nullable=False)
    periodo_referencia = Column(String(7), nullable=False)
    base_salary        = Column(Float, nullable=False)
    bonus              = Column(Float, default=0.0)
    deductions         = Column(Float, default=0.0)
    inss               = Column(Float, default=0.0)
    fgts               = Column(Float, default=0.0)
    net_salary         = Column(Float, nullable=False)
    payment_date       = Column(Date, nullable=True)
    status             = Column(String(20), default="pending")
    notes              = Column(Text, nullable=True)
    created_at         = Column(DateTime, server_default=func.now())
    employee           = relationship("Employee", back_populates="salary_payments")
    user               = relationship("User", back_populates="salary_payments")
