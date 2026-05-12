@echo off
chcp 65001 >nul 2>&1
echo Parando FinanceControl...

docker compose version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    docker compose down
) else (
    docker-compose down
)

echo Sistema parado.
pause
