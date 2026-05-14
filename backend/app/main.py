import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.types import Scope, Receive, Send
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import auth, transactions, categories, cards, invoices, reports, employees


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _auto_migrate()
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
            else:
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin'"
                ))
    except Exception:
        pass


app = FastAPI(
    title="FinanceControl API",
    version="2.6.0",
    description="Sistema de Gestão Financeira com classificação IFRS",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.6.0"}


# ── Serve frontend static files in production ─────────────────────
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


class SPAStaticFiles(StaticFiles):
    """StaticFiles que faz fallback para index.html (SPA routing)."""
    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except Exception:
            return FileResponse(
                str(self.directory / "index.html"),
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                },
            )


if STATIC_DIR.exists():
    # /assets → arquivos estáticos do build Vite
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")
    # / → SPA com fallback para index.html (montado por último, API tem prioridade)
    app.mount("/", SPAStaticFiles(directory=str(STATIC_DIR), html=True), name="spa")
