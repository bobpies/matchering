@echo off
REM Script para iniciar/reiniciar Matchering 2025 no Docker
REM Este script para, remove, constroi e inicia o container

echo ========================================
echo  Matchering 2025 - Docker Start/Restart
echo ========================================
echo.

REM Verificar se o Docker está em execução
echo [1/5] Verificando se o Docker esta em execucao...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Docker nao esta em execucao!
    echo Por favor, inicie o Docker Desktop e tente novamente.
    pause
    exit /b 1
)
echo Docker esta em execucao!
echo.

REM Parar o container se estiver em execucao
echo [2/5] Parando container se estiver em execucao...
docker ps --filter "name=matchering-app" --format "{{.Names}}" | findstr /C:"matchering-app" >nul
if %errorlevel% equ 0 (
    echo Container encontrado em execucao. A parar...
    docker stop matchering-app >nul 2>&1
    echo Container parado.
) else (
    echo Nenhum container em execucao.
)
echo.

REM Remover o container se existir
echo [3/5] Removendo container existente...
docker ps -a --filter "name=matchering-app" --format "{{.Names}}" | findstr /C:"matchering-app" >nul
if %errorlevel% equ 0 (
    echo Container encontrado. A remover...
    docker rm matchering-app >nul 2>&1
    echo Container removido.
) else (
    echo Nenhum container existente para remover.
)
echo.

REM Construir a imagem Docker
echo [4/5] Construindo imagem Docker...
echo Isto pode demorar alguns minutos na primeira vez...
echo.
echo Tentando fazer pull da imagem base Python...
docker pull python:3.10-slim
if %errorlevel% neq 0 (
    echo.
    echo AVISO: Falha ao fazer pull da imagem base.
    echo Tentando continuar com cache local...
    echo.
)

echo Construindo a imagem da aplicacao...
docker build -t matchering-app:latest .
if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha ao construir a imagem Docker.
    echo.
    echo Possiveis solucoes:
    echo 1. Verifique a sua conexao a Internet
    echo 2. Tente reiniciar o Docker Desktop
    echo 3. Verifique as configuracoes de proxy do Docker
    echo 4. Tente executar: docker pull python:3.10-slim
    echo.
    pause
    exit /b 1
)
echo Imagem construida com sucesso!
echo.

REM Iniciar o container
echo [5/5] Iniciando container...
docker run -d ^
    -p 8360:8360 ^
    -v matchering-uploads:/app/uploads ^
    -v matchering-results:/app/results ^
    -v matchering-previews:/app/previews ^
    --name matchering-app ^
    --restart always ^
    matchering-app:latest

if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha ao iniciar o container.
    pause
    exit /b 1
)

echo.
echo Aguardando o servidor iniciar...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo  Sucesso!
echo ========================================
echo.
echo Matchering 2025 esta disponivel em:
echo.
echo    http://127.0.0.1:8360
echo.
echo O container sera iniciado automaticamente
echo sempre que o Docker Desktop iniciar.
echo.
echo Para parar o container, execute: docker stop matchering-app
echo Para ver os logs, execute: docker logs -f matchering-app
echo.
pause

