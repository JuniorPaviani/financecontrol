# FinanceControl

Sistema de Gestao Financeira com classificacao IFRS, leitor de faturas PDF e dashboards.

## Funcionalidades

- Login/Cadastro com senha criptografada (BCrypt + JWT)
- Dashboard com KPIs e graficos (Receitas, Despesas, Saldo, Parcelas Futuras)
- Lancamentos com suporte a parcelas projetadas nos meses futuros
- Importacao de faturas PDF de 7 bancos
- Categorias IFRS (Custos Operacionais, Desp. Administrativas, Desp. Financeiras, Investimentos)
- Relatorios comparativos (mes atual vs anterior)
- Gestao de cartoes de credito

## Bancos suportados (PDF)

| Banco | Status |
|-------|--------|
| Itau | OK |
| Santander | OK |
| Bradesco | OK |
| Caixa | OK |
| Sam's Club | OK |
| Sicredi | OK |
| Riachuelo | OK |

## Instalacao Local (Windows)

1. Baixe ou clone este repositorio
2. Execute `INSTALAR.bat` (instala Python, Node.js e dependencias)
3. Execute `INICIAR_LOCAL.bat`
4. Acesse `http://localhost:3000`
5. Crie sua conta no primeiro acesso

## Deploy na Nuvem (Render.com)

1. Faca fork ou push deste repo no GitHub
2. Acesse https://render.com e conecte sua conta GitHub
3. Clique em "New" > "Blueprint" e selecione este repositorio
4. O `render.yaml` configura tudo automaticamente (backend + PostgreSQL)
5. Aguarde o deploy e acesse a URL gerada

## Stack

- **Backend:** Python 3.12 / FastAPI / SQLAlchemy / PDFPlumber
- **Frontend:** React 18 / Vite / Recharts / Lucide Icons
- **Banco:** SQLite (local) / PostgreSQL (nuvem)
- **Auth:** BCrypt + JWT

## Estrutura

```
financecontrol/
  backend/
    app/
      main.py          # FastAPI + serve frontend
      models.py        # Tabelas (Users, Transactions, Cards, Categories)
      schemas.py       # Validacao Pydantic
      auth.py          # JWT + BCrypt
      database.py      # SQLite/PostgreSQL
      routers/         # auth, transactions, cards, categories, invoices, reports
      parsers/         # itau, santander, bradesco, caixa, banks (sams, sicredi, riachuelo)
  frontend/
    src/App.jsx        # Interface completa
  render.yaml          # Deploy automatico Render
  INSTALAR.bat         # Instalacao Windows
  INICIAR_LOCAL.bat    # Iniciar localmente
```
