"""Gera DOCUMENTACAO.pdf a partir dos dados do projeto FinanceControl."""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
import os

doc = SimpleDocTemplate(
    os.path.join(os.path.dirname(__file__), "DOCUMENTACAO.pdf"),
    pagesize=A4,
    rightMargin=2*cm, leftMargin=2*cm,
    topMargin=2*cm, bottomMargin=2*cm,
)

styles = getSampleStyleSheet()

title_style = ParagraphStyle("Title", parent=styles["Heading1"],
    fontSize=22, textColor=colors.HexColor("#1a3a1a"),
    spaceAfter=4, alignment=TA_CENTER, fontName="Helvetica-Bold")

subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"],
    fontSize=10, textColor=colors.HexColor("#4a7a4a"),
    spaceAfter=16, alignment=TA_CENTER, fontName="Helvetica")

h1_style = ParagraphStyle("H1", parent=styles["Heading1"],
    fontSize=13, textColor=colors.HexColor("#ffffff"),
    spaceBefore=18, spaceAfter=6, fontName="Helvetica-Bold",
    backColor=colors.HexColor("#2d5a2d"), leftIndent=-8, rightIndent=-8)

h2_style = ParagraphStyle("H2", parent=styles["Heading2"],
    fontSize=10, textColor=colors.HexColor("#2d5a2d"),
    spaceBefore=10, spaceAfter=3, fontName="Helvetica-Bold")

body_style = ParagraphStyle("Body", parent=styles["Normal"],
    fontSize=9, textColor=colors.HexColor("#222222"),
    spaceAfter=4, fontName="Helvetica", leading=14)

code_style = ParagraphStyle("Code", parent=styles["Normal"],
    fontSize=8, textColor=colors.HexColor("#1a1a2e"),
    fontName="Courier", backColor=colors.HexColor("#f4f4f4"),
    leftIndent=10, spaceAfter=2, spaceBefore=2, leading=12,
    borderPad=3)

bullet_style = ParagraphStyle("Bullet", parent=styles["Normal"],
    fontSize=9, textColor=colors.HexColor("#222222"),
    leftIndent=14, fontName="Helvetica", leading=14, spaceAfter=2)

footer_style = ParagraphStyle("Footer", parent=styles["Normal"],
    fontSize=8, textColor=colors.HexColor("#666666"), alignment=TA_CENTER)

story = []


def h1(t):
    story.append(Paragraph(f"  {t}", h1_style))


def h2(t):
    story.append(Paragraph(t, h2_style))


def p(t):
    story.append(Paragraph(t, body_style))


def code(t):
    story.append(Paragraph(t if t else " ", code_style))


def bullet(t):
    story.append(Paragraph(f"&#x2022;  {t}", bullet_style))


def sp(n=0.2):
    story.append(Spacer(1, n*cm))


def table(data, col_widths, header_color="#2d5a2d"):
    t = Table(data, colWidths=[w*cm for w in col_widths])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(header_color)),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#aaaaaa")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f0f7f0")]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(t)


# ── Capa ──────────────────────────────────────────────────────────────────────
sp(0.5)
story.append(Paragraph("FinanceControl", title_style))
story.append(Paragraph("Documentação Técnica — v2.6.0 · 15/05/2026", subtitle_style))
story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#2d5a2d")))
sp(0.5)

# ── 1. VISÃO GERAL ────────────────────────────────────────────────────────────
h1("1. Visão Geral")
p("Sistema de gestão financeira com classificação IFRS, para controle empresarial completo de receitas, despesas, cartões, folha de pagamento e relatórios.")
sp()
p("<b>Funcionalidades principais:</b>")
for feat in [
    "Lançamentos de receitas e despesas com classificação IFRS",
    "Gestão de cartões de crédito (limite, fechamento, vencimento)",
    "Importação de faturas PDF de múltiplos bancos brasileiros",
    "Relatórios: DRE, fluxo de caixa, conciliação por categoria",
    "Gestão de funcionários e folha de pagamento (INSS, FGTS, bônus)",
    "Controle de categorias com agrupamento IFRS personalizável",
    "Múltiplos usuários com controle granular de permissões",
]:
    bullet(feat)
sp()
table([
    ["Versão", "URL", "Repositório GitHub", "Branch"],
    ["Rotas Café (Prod)", "financecontrol-kiyl.onrender.com", "JuniorPaviani/rotas-cafe", "main"],
    ["Rotas Café (Staging)", "rotas-cafe-staging.onrender.com", "JuniorPaviani/rotas-cafe", "dev"],
    ["FinanceControl (Prod)", "financecontrol-public.onrender.com", "JuniorPaviani/financecontrol", "main"],
], [3.8, 5.2, 5.2, 2.3])

# ── 2. ARQUITETURA ────────────────────────────────────────────────────────────
h1("2. Arquitetura")
p("Monolito com SPA React servida pelo próprio FastAPI em produção. Frontend compilado durante o build e embutido como arquivos estáticos.")
sp()
code("[ React 18 + Vite ]  ─── REST/JSON ───>  [ FastAPI 0.115 (Python 3.12) ]")
code("                                                    |")
code("                                              SQLAlchemy ORM")
code("                                                    |")
code("                                        [ PostgreSQL (Render / Neon.tech) ]")
sp()
for item in [
    "Produção: frontend embutido no backend, uma única instância Render",
    "Desenvolvimento: Vite :5173 + Uvicorn :8000, CORS liberado para localhost",
    "Qualquer rota não-/api/ devolve index.html (SPA client-side routing)",
]:
    bullet(item)

# ── 3. STACK ──────────────────────────────────────────────────────────────────
h1("3. Stack Tecnológica")
h2("Backend (Python 3.12.10)")
table([
    ["Biblioteca", "Versão", "Finalidade"],
    ["FastAPI", "0.115.0", "Framework web ASGI"],
    ["Uvicorn", "0.30.6", "Servidor ASGI"],
    ["SQLAlchemy", "2.0.35", "ORM"],
    ["Pydantic", "2.9.2", "Validação / serialização"],
    ["python-jose", "3.3.0", "JWT tokens"],
    ["passlib + bcrypt", "4.1.3", "Hash de senhas"],
    ["pdfplumber", "0.11.4", "Extração de texto de PDF"],
    ["openpyxl", "3.1.5", "Exportação Excel"],
    ["reportlab", "4.5.1", "Geração de PDF"],
    ["psycopg2-binary", "2.9.9", "Driver PostgreSQL"],
    ["Alembic", "1.13.3", "Migrações de banco de dados"],
], [3.5, 2.5, 10.5])
sp()
h2("Frontend (Node 20.18.0)")
for item in ["React 18 + Vite", "Lucide React — ícones", "Recharts — gráficos", "XLSX / ExcelJS — exportação de planilhas"]:
    bullet(item)

# ── 4. ESTRUTURA ──────────────────────────────────────────────────────────────
h1("4. Estrutura de Diretórios")
for line in [
    "financecontrol/",
    "├── backend/app/",
    "│   ├── main.py          # Entrypoint, lifespan, SPA serving",
    "│   ├── models.py        # Todos os modelos ORM",
    "│   ├── schemas.py       # Schemas Pydantic",
    "│   ├── auth.py          # JWT, hash, get_current_user",
    "│   ├── routers/         # auth, transactions, categories, cards,",
    "│   │                    #   invoices, reports, employees, users",
    "│   └── parsers/         # base, itau, bradesco, santander, caixa, banks",
    "├── frontend/src/",
    "│   ├── App.jsx          # Roteamento de abas + guarda de autenticação",
    "│   ├── hooks/useAuth.js # Token JWT, login/logout, persist localStorage",
    "│   ├── api/client.js    # apiFetch — wrapper HTTP com Bearer token",
    "│   ├── styles/theme.js  # Paleta de cores e helpers de estilo",
    "│   └── components/      # auth, dashboard, transactions, import, fatura,",
    "│                        #   cards, categories, reports, employees, users",
    "├── render.yaml          # Blueprint Render (DB + serviço web)",
    "├── render-build.sh      # Build: npm install + npm run build + pip install",
    "└── docker-compose.yml   # Desenvolvimento local",
]:
    code(line)

# ── 5. MODELOS ────────────────────────────────────────────────────────────────
h1("5. Modelos de Dados")
table([
    ["Modelo", "Campos-chave", "Relacionamentos"],
    ["User", "id, name, email, hashed_password\nrole (admin|user)\ncan_view_reports, can_view_receitas\nforce_password_change, is_active", "→ transactions, cards\n   categories, employees\n   salary_payments"],
    ["Transaction", "id, user_id, category_id, card_id\ntype (D/R), date, description, amount\nperiodo_referencia, installment_*\nsource (manual|pdf_import)", "→ User\n→ Category\n→ Card"],
    ["Category", "id, user_id, name, ifrs_group\nicon, color", "→ User\n→ transactions"],
    ["Card", "id, user_id, name, bank, last_four\ncredit_limit, closing_day, due_day", "→ User\n→ transactions"],
    ["Employee", "id, user_id, name, cpf, position\ndepartment, base_salary, status", "→ SalaryPayment"],
    ["SalaryPayment", "base_salary, bonus, deductions\ninss, fgts, net_salary, status", "→ Employee, User"],
    ["ImportLog", "batch_id, bank, filename\ntotal_rows, imported_rows, status", "→ User"],
    ["PasswordResetToken", "token (64 chars), expires_at, used", "→ User"],
], [3.2, 6.8, 6.5])

# ── 6. API ────────────────────────────────────────────────────────────────────
h1("6. API — Endpoints")
api_groups = [
    ("/api/auth", "Autenticação", [
        ("POST", "/register", "Cadastro + seed categorias padrão"),
        ("POST", "/login", "Login (e-mail ou login alfanumérico) + senha → JWT"),
        ("GET",  "/me", "Retorna usuário autenticado"),
        ("POST", "/forgot-password", "Envia e-mail com link de reset"),
        ("POST", "/reset-password", "Redefine senha via token de e-mail"),
        ("POST", "/change-password", "Troca senha + limpa force_password_change"),
    ]),
    ("/api/transactions", "Lançamentos", [
        ("GET",    "/", "Lista com filtros: período, tipo, cartão, busca"),
        ("POST",   "/", "Cria lançamento (suporte a parcelamento automático)"),
        ("PUT",    "/{id}", "Atualiza lançamento"),
        ("DELETE", "/{id}", "Remove (ou grupo de parcelas inteiro)"),
    ]),
    ("/api/invoices", "Faturas PDF", [
        ("POST", "/upload",  "Upload PDF → auto-detecta banco → extrai transações"),
        ("POST", "/confirm", "Confirma e persiste as transações extraídas"),
    ]),
    ("/api/reports", "Relatórios", [
        ("GET", "/summary",        "Resumo mensal (N meses)"),
        ("GET", "/dre",            "DRE — Demonstração do Resultado"),
        ("GET", "/reconciliation", "Conciliação por categoria"),
        ("GET", "/cashflow",       "Fluxo de caixa"),
        ("GET", "/export/excel",   "Exportação para Excel (.xlsx)"),
    ]),
    ("/api/employees", "Funcionários", [
        ("GET",    "/",               "Lista funcionários"),
        ("POST",   "/",               "Cadastra funcionário"),
        ("PUT",    "/{id}",           "Atualiza dados"),
        ("DELETE", "/{id}",           "Remove funcionário"),
        ("GET",    "/{id}/payments",  "Histórico de pagamentos"),
        ("POST",   "/{id}/payments",  "Registra pagamento de salário"),
    ]),
    ("/api/users", "Usuários (admin)", [
        ("GET",    "/",     "Lista usuários da conta"),
        ("POST",   "/",     "Cria usuário com permissões"),
        ("PUT",    "/{id}", "Atualiza permissões / dados"),
        ("DELETE", "/{id}", "Remove usuário"),
    ]),
]

for prefix, name, eps in api_groups:
    h2(f"{name}  ({prefix})")
    table(
        [["Método", "Rota", "Descrição"]] + list(eps),
        [1.8, 3.8, 10.9],
        header_color="#4a7a4a",
    )
    sp(0.15)

# ── 7. AUTH & SEGURANÇA ───────────────────────────────────────────────────────
h1("7. Autenticação e Segurança")
for item in [
    "Tokens JWT (HS256) com expiração configurável (TOKEN_EXPIRE_HOURS, padrão 48h)",
    "Senhas com hash bcrypt via passlib",
    "SECRET_KEY gerado automaticamente pelo Render — nunca exposto no código",
    "Em ENVIRONMENT=production: Swagger UI e ReDoc desabilitados",
    "Reset de senha via token único de 64 chars com TTL de 1 hora",
    "force_password_change: admin criado via seed é forçado a trocar senha no 1° login",
]:
    bullet(item)
sp()
p("<b>Roles de usuário:</b>")
bullet("<b>admin</b> — acesso total, incluindo gestão de outros usuários")
bullet("<b>user</b>  — acesso limitado pelas flags can_view_reports e can_view_receitas")

# ── 8. PARSERS PDF ────────────────────────────────────────────────────────────
h1("8. Importação de Faturas PDF")
p("Bancos com parser implementado: <b>Itaú · Bradesco · Santander · Caixa Econômica Federal · Sam's Club · Sicredi · Stone · Riachuelo (Midway)</b>")
sp()
p("<b>Fluxo de importação:</b>")
steps = [
    "Upload do arquivo PDF pelo usuário na aba Importar",
    "pdfplumber extrai o texto bruto do PDF",
    "Auto-detecção do banco por regex nos parsers (método detect())",
    "Parser específico extrai: data, descrição, valor, parcela (ex.: 02/12)",
    "Frontend exibe prévia das transações com sugestão de categoria",
    "Usuário revisa, ajusta categorias e confirma",
    "Transações salvas com source='pdf_import' e batch_id único (UUID)",
    "ImportLog registra: banco, arquivo, total_rows, imported_rows, status",
]
for i, s in enumerate(steps, 1):
    bullet(f"{i}. {s}")

# ── 9. AMBIENTES ──────────────────────────────────────────────────────────────
h1("9. Ambientes")
table([
    ["Ambiente", "Branch", "ENVIRONMENT", "Swagger", "Log Level", "URL"],
    ["Produção (Rotas Café)", "main", "production", "OFF", "WARNING", "financecontrol-kiyl.onrender.com"],
    ["Staging (Rotas Café)", "dev", "staging", "ON", "INFO", "rotas-cafe-staging.onrender.com"],
    ["Produção (FinanceControl)", "main", "production", "OFF", "WARNING", "financecontrol-public.onrender.com"],
    ["Desenvolvimento local", "—", "development", "ON", "INFO", "localhost:5173 / :8000"],
], [3.5, 1.5, 2.3, 1.5, 2, 5.7])

# ── 10. DEPLOY ────────────────────────────────────────────────────────────────
h1("10. Deploy — Render.com")
h2("Comandos")
code("Build:  chmod +x render-build.sh && ./render-build.sh")
code("Start:  cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT")
sp()
h2("Variáveis de Ambiente")
table([
    ["Variável", "Obrigatório", "Descrição"],
    ["DATABASE_URL", "Sim (prod)", "Connection string PostgreSQL"],
    ["SECRET_KEY", "Sim", "Chave JWT (gerada pelo Render automaticamente)"],
    ["TOKEN_EXPIRE_HOURS", "Não", "Expiração JWT em horas (padrão: 48)"],
    ["ENVIRONMENT", "Não", '"production" | "staging" | "development"'],
    ["PYTHON_VERSION", "Sim", "3.12.10"],
    ["NODE_VERSION", "Sim", "20.18.0"],
    ["ADMIN_LOGIN", "Não", "Login do usuário admin master (seed no startup)"],
    ["ADMIN_PASSWORD", "Não", "Senha provisória do admin (force_password_change=True)"],
    ["FRONTEND_URL", "Não", "URL base para links de e-mail de reset de senha"],
], [4.5, 2.5, 9.5])

# ── 11. COMO RODAR LOCALMENTE ─────────────────────────────────────────────────
h1("11. Como Rodar Localmente")
h2("Opção A — Docker (recomendado)")
code("Windows:    duplo clique em INICIAR.bat")
code("Linux/Mac:  docker-compose up -d")
code("Acesso:     http://localhost:5173  (frontend)")
code("            http://localhost:8000  (backend / Swagger: /docs)")
sp()
h2("Opção B — Manual")
code("cd backend")
code("python -m venv .venv && .venv\\Scripts\\activate")
code("pip install -r requirements.txt")
code("uvicorn app.main:app --reload")
sp()
code("cd frontend")
code("npm install && npm run dev")
sp()
h2("Arquivo backend/.env para desenvolvimento")
code("DATABASE_URL=sqlite:///./financecontrol.db")
code("SECRET_KEY=qualquer-chave-local-aqui")
code("ENVIRONMENT=development")

# ── Footer ────────────────────────────────────────────────────────────────────
sp(1.0)
story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#4a7a4a")))
sp(0.2)
story.append(Paragraph(
    "FinanceControl v2.6.0  ·  Documentação gerada em 15/05/2026  ·  Junior Paviani",
    footer_style,
))

doc.build(story)
print("PDF gerado: docs/DOCUMENTACAO.pdf")
