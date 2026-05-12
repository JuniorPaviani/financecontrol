from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Boolean, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(120), nullable=False)
    email         = Column(String(180), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, server_default=func.now())

    transactions  = relationship("Transaction", back_populates="user", cascade="all, delete")
    cards         = relationship("Card", back_populates="user", cascade="all, delete")
    categories    = relationship("Category", back_populates="user", cascade="all, delete")


class Category(Base):
    __tablename__ = "categories"
    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    name          = Column(String(80), nullable=False)
    ifrs_group    = Column(String(80), nullable=False)   # Custos Operacionais | Despesas Administrativas | Despesas Financeiras | Investimentos
    icon          = Column(String(10), default="💰")
    color         = Column(String(10), default="#2563EB")

    user          = relationship("User", back_populates="categories")
    transactions  = relationship("Transaction", back_populates="category")


class Card(Base):
    __tablename__ = "cards"
    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    name          = Column(String(80), nullable=False)        # Ex: "Itaú Mastercard Gold"
    bank          = Column(String(60), nullable=False)        # Ex: "Itaú"
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

    type            = Column(String(1), nullable=False)          # D = Despesa | R = Receita
    date            = Column(Date, nullable=False)
    description     = Column(String(255), nullable=False)
    supplier        = Column(String(120), nullable=True)
    amount          = Column(Float, nullable=False)
    periodo_referencia = Column(String(7), nullable=False)       # YYYY-MM

    # Installments
    installment_current = Column(Integer, nullable=True)         # ex: 2
    installment_total   = Column(Integer, nullable=True)         # ex: 10
    installment_group   = Column(String(36), nullable=True)      # UUID to group parcelas

    # Import metadata
    source          = Column(String(40), default="manual")       # manual | itau | santander | ...
    import_batch_id = Column(String(36), nullable=True)
    notes           = Column(Text, nullable=True)

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
    status          = Column(String(20), default="success")      # success | partial | error
    error_detail    = Column(Text, nullable=True)
    created_at      = Column(DateTime, server_default=func.now())
