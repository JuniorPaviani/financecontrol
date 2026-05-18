import os
import logging
from pathlib import Path
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import auth, transactions, categories, cards, invoices, reports, employees, users

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PROD = ENVIRONMENT == "production"

logging.basicConfig(
    level=logging.WARNING if IS_PROD else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting FinanceControl — env=%s", ENVIRONMENT)
    Base.metadata.create_all(bind=engine)
    _auto_migrate()
    _seed_admin()
    yield


def _auto_migrate():
    """Apply incremental schema changes — works on both SQLite and PostgreSQL."""
    from sqlalchemy import text
    db_url = os.getenv("DATABASE_URL", "sqlite:///./financecontrol.db")
    try:
        with engine.begin() as conn:
            if db_url.startswith("sqlite"):
                result = conn.execute(text("PRAGMA table_info(users)"))
                cols = {row[1] for row in result.fetchall()}
                if "role" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'admin'"))
                if "can_view_reports" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN can_view_reports BOOLEAN DEFAULT 0"))
                if "can_view_receitas" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN can_view_receitas BOOLEAN DEFAULT 0"))
                if "force_password_change" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN force_password_change BOOLEAN DEFAULT 0"))
                # transactions new columns
                result2 = conn.execute(text("PRAGMA table_info(transactions)"))
                tx_cols = {row[1] for row in result2.fetchall()}
                if "payment_method" not in tx_cols:
                    conn.execute(text("ALTER TABLE transactions ADD COLUMN payment_method VARCHAR(20) DEFAULT 'cartao'"))
                if "paid" not in tx_cols:
                    conn.execute(text("ALTER TABLE transactions ADD COLUMN paid BOOLEAN DEFAULT 0"))
                # card_invoice_status table
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS card_invoice_status (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL REFERENCES users(id),
                        card_id INTEGER NOT NULL REFERENCES cards(id),
                        period VARCHAR(7) NOT NULL,
                        paid BOOLEAN DEFAULT 0,
                        paid_at DATETIME,
                        alerted_at DATETIME
                    )
                """))
            else:
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin'"
                ))
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS can_view_reports BOOLEAN DEFAULT FALSE"
                ))
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS can_view_receitas BOOLEAN DEFAULT FALSE"
                ))
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE"
                ))
                conn.execute(text(
                    "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cartao'"
                ))
                conn.execute(text(
                    "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE"
                ))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS card_invoice_status (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id),
                        card_id INTEGER NOT NULL REFERENCES cards(id),
                        period VARCHAR(7) NOT NULL,
                        paid BOOLEAN DEFAULT FALSE,
                        paid_at TIMESTAMP,
                        alerted_at TIMESTAMP
                    )
                """))
    except Exception:
        pass


def _seed_admin():
    """Cria usuário admin master via env vars ADMIN_LOGIN / ADMIN_PASSWORD."""
    admin_login    = os.getenv("ADMIN_LOGIN", "").strip()
    admin_password = os.getenv("ADMIN_PASSWORD", "").strip()
    if not admin_login or not admin_password:
        logger.warning("ADMIN_LOGIN/ADMIN_PASSWORD not set — skipping seed")
        return
    from app.database import SessionLocal
    from app import models, auth as auth_module
    db = SessionLocal()
    try:
        existing = db.query(models.User).filter(models.User.email == admin_login).first()
        if existing:
            existing.hashed_password = auth_module.hash_password(admin_password)
            existing.role = "admin"
            existing.force_password_change = False
            db.commit()
            logger.warning("Admin '%s' password updated via seed", admin_login)
            return
        admin = models.User(
            name="Administrador",
            email=admin_login,
            hashed_password=auth_module.hash_password(admin_password),
            role="admin",
            force_password_change=False,
        )
        db.add(admin)
        db.commit()
        logger.warning("Admin '%s' created successfully", admin_login)
    except Exception as e:
        logger.error("Failed to seed admin: %s", e)
        db.rollback()
    finally:
        db.close()


app = FastAPI(
    title="FinanceControl API",
    version="2.6.0",
    description="Sistema de Gestão Financeira com classificação IFRS",
    lifespan=lifespan,
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None if IS_PROD else "/redoc",
)

ALLOWED_ORIGINS = (
    ["*"] if not IS_PROD
    else [
        os.getenv("FRONTEND_URL", "https://financecontrol-kiyl.onrender.com"),
        "https://rotas-cafe.onrender.com",
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/api/auth",         tags=["Autenticação"])
app.include_router(transactions.router, prefix="/api/transactions",  tags=["Lançamentos"])
app.include_router(categories.router,   prefix="/api/categories",    tags=["Categorias"])
app.include_router(cards.router,        prefix="/api/cards",         tags=["Cartões"])
app.include_router(invoices.router,     prefix="/api/invoices",      tags=["Faturas PDF"])
app.include_router(reports.router,      prefix="/api/reports",       tags=["Relatórios"])
app.include_router(employees.router,    prefix="/api/employees",     tags=["Funcionários"])
app.include_router(users.router,        prefix="/api/users",         tags=["Usuários"])


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.6.0", "env": ENVIRONMENT}


# ── Serve frontend static files in production ─────────────────────
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str, response: Response):
        """Serve React SPA — any non-API route returns index.html"""
        if full_path.startswith("api/") or full_path == "api":
            return {"detail": "Not Found"}
        file_path = STATIC_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(
            str(STATIC_DIR / "index.html"),
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        )
