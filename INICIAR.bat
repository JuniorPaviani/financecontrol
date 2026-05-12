@echo off
chcp 65001 >nul 2>&1
echo ================================================
echo   FinanceControl - Iniciando com Docker
echo ================================================
echo.

REM Verifica Docker
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Docker nao encontrado!
    echo Instale o Docker Desktop em: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo [OK] Docker encontrado

REM Verifica se Docker daemon esta rodando
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] Docker Desktop nao esta rodando. Iniciando...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Aguardando Docker iniciar...
    :WAIT_DOCKER
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if %ERRORLEVEL% neq 0 goto WAIT_DOCKER
    echo [OK] Docker Desktop iniciado!
)

echo.
echo Construindo e iniciando containers...
echo Isso pode demorar 2-3 minutos na primeira vez.
echo.

REM Tenta Docker Compose V2 primeiro, fallback para V1
docker compose version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    docker compose up --build -d
) else (
    docker-compose up --build -d
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERRO] Falha ao iniciar containers.
    echo Verifique se o Docker Desktop esta rodando corretamente.
    pause
    exit /b 1
)

echo.
echo ================================================
echo   Sistema iniciado com sucesso!
echo ================================================
echo.
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:8000
echo   Docs API: http://localhost:8000/docs
echo.
echo   Crie sua conta no primeiro acesso.
echo ================================================
echo.

timeout /t 4 >nul
start http://localhost:3000

echo Pressione qualquer tecla para ver os logs...
pause >nul

docker compose version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    docker compose logs -f
) else (
    docker-compose logs -f
)
