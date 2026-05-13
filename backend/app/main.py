import os
from pathlib import Path
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import auth, transactions, categories, cards, invoices, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


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


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.6.0"}


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
