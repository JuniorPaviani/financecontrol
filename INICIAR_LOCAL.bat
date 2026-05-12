@echo off
chcp 65001 >nul 2>&1
echo ================================================
echo   FinanceControl - Modo Local (sem Docker)
echo ================================================
echo.

set "PROJECT_DIR=%~dp0"
set "BACKEND_DIR=%PROJECT_DIR%backend"
set "FRONTEND_DIR=%PROJECT_DIR%frontend"

REM Configuracoes do Backend
set DATABASE_URL=sqlite:///./financecontrol.db
set SECRET_KEY=FC_SECRET_KEY_2025_TROQUE_EM_PRODUCAO
set TOKEN_EXPIRE_HOURS=24

REM Verifica Python
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Python nao encontrado!
    echo Instale via: winget install Python.Python.3.12
    pause
    exit /b 1
)
echo [OK] Python encontrado

REM Verifica Node
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Instale via: winget install OpenJS.NodeJS.LTS
    pause
    exit /b 1
)
echo [OK] Node.js encontrado

REM Instala dependencias do backend (se necessario)
if not exist "%BACKEND_DIR%\venv" (
    echo.
    echo Instalando dependencias do backend...
    cd /d "%BACKEND_DIR%"
    pip install -r requirements.txt >nul 2>&1
    echo [OK] Backend configurado
) else (
    echo [OK] Backend ja configurado
)

REM Instala dependencias do frontend (se necessario)
if not exist "%FRONTEND_DIR%\node_modules" (
    echo.
    echo Instalando dependencias do frontend...
    cd /d "%FRONTEND_DIR%"
    call npm install >nul 2>&1
    echo [OK] Frontend configurado
) else (
    echo [OK] Frontend ja configurado
)

echo.
echo Iniciando Backend (porta 8000)...
cd /d "%BACKEND_DIR%"
start "FinanceControl-Backend" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo Iniciando Frontend (porta 3000)...
cd /d "%FRONTEND_DIR%"
start "FinanceControl-Frontend" cmd /k "npx vite --host 0.0.0.0 --port 3000"

echo.
echo ================================================
echo   Sistema iniciado!
echo ================================================
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo   Crie sua conta no primeiro acesso.
echo   Feche as janelas de terminal para parar.
echo ================================================
echo.

timeout /t 5 >nul
start http://localhost:3000
pause
