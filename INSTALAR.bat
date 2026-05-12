@echo off
chcp 65001 >nul 2>&1
echo ================================================
echo   FinanceControl - Instalacao Automatica
echo ================================================
echo.
echo Este script instala tudo que voce precisa:
echo   - Python 3.12
echo   - Node.js LTS
echo   - Dependencias do backend e frontend
echo.
echo Pressione qualquer tecla para iniciar...
pause >nul

set "PROJECT_DIR=%~dp0"

REM ================================================================
REM 1. VERIFICAR / INSTALAR PYTHON
REM ================================================================
echo.
echo [1/4] Verificando Python...
python --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo   [OK] Python ja instalado
    goto :CHECK_NODE
)

echo   Python nao encontrado. Instalando...
winget --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo   [ERRO] winget nao disponivel.
    echo   Instale o Python manualmente: https://www.python.org/downloads/
    echo   Marque "Add Python to PATH" durante a instalacao!
    pause
    exit /b 1
)

winget install Python.Python.3.12 --accept-package-agreements --accept-source-agreements --silent
if %ERRORLEVEL% neq 0 (
    echo   [ERRO] Falha ao instalar Python.
    pause
    exit /b 1
)
echo   [OK] Python instalado

REM Atualiza PATH
set "PATH=%PATH%;%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python312\Scripts"

:CHECK_NODE
REM ================================================================
REM 2. VERIFICAR / INSTALAR NODE.JS
REM ================================================================
echo.
echo [2/4] Verificando Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo   [OK] Node.js ja instalado
    goto :INSTALL_BACKEND
)

echo   Node.js nao encontrado. Instalando...
winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent
if %ERRORLEVEL% neq 0 (
    echo   [ERRO] Falha ao instalar Node.js.
    echo   Instale manualmente: https://nodejs.org/
    pause
    exit /b 1
)
echo   [OK] Node.js instalado

REM Atualiza PATH
set "PATH=%PATH%;C:\Program Files\nodejs"

:INSTALL_BACKEND
REM ================================================================
REM 3. INSTALAR DEPENDENCIAS DO BACKEND
REM ================================================================
echo.
echo [3/4] Instalando dependencias do backend...
cd /d "%PROJECT_DIR%backend"
python -m pip install --upgrade pip >nul 2>&1
python -m pip install -r requirements.txt >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo   [AVISO] Algumas dependencias podem ter falhado.
    echo   Tentando novamente com output...
    python -m pip install -r requirements.txt
)
echo   [OK] Backend configurado

REM ================================================================
REM 4. INSTALAR DEPENDENCIAS DO FRONTEND
REM ================================================================
echo.
echo [4/4] Instalando dependencias do frontend...
cd /d "%PROJECT_DIR%frontend"
call npm install >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo   [AVISO] Tentando novamente...
    call npm install
)
echo   [OK] Frontend configurado

REM ================================================================
REM CONCLUIDO
REM ================================================================
echo.
echo ================================================
echo   Instalacao concluida com sucesso!
echo ================================================
echo.
echo   Para iniciar o sistema, execute:
echo     INICIAR_LOCAL.bat
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo   Crie sua conta no primeiro acesso.
echo ================================================
echo.
pause
