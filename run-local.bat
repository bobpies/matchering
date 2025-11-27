@echo off
REM Script para executar a aplicacao localmente sem Docker

echo ========================================
echo  Matchering 2025 - Execucao Local
echo ========================================
echo.

echo Este script executa a aplicacao diretamente no Windows
echo sem necessidade de Docker.
echo.

REM Verificar Python
echo [1/3] Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Python nao encontrado!
    echo.
    echo Por favor, instale Python 3.8 ou superior de:
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)
python --version
echo Python encontrado!
echo.

REM Verificar FFmpeg
echo [2/3] Verificando FFmpeg...
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo AVISO: FFmpeg nao encontrado!
    echo.
    echo FFmpeg e necessario para exportacao MP3.
    echo Download: https://ffmpeg.org/download.html
    echo.
    echo A aplicacao funcionara, mas exportacao MP3 estara desativada.
    echo.
    timeout /t 3 /nobreak >nul
) else (
    echo FFmpeg encontrado!
)
echo.

REM Verificar versao do Python e escolher requirements
echo [3/4] Verificando versao do Python...
python check-python-version.py >nul 2>&1
set PYTHON_VER=%errorlevel%
if %PYTHON_VER% equ 1 (
    echo Python 3.14+ detectado. Usando requirements alternativo (sem resampy).
    set REQ_FILE=requirements-py314.txt
) else (
    if %PYTHON_VER% equ 0 (
        echo Python 3.10-3.13 detectado. Usando requirements.txt normal.
        set REQ_FILE=requirements.txt
    ) else (
        echo ERRO: Python 3.10 ou superior e necessario!
        pause
        exit /b 1
    )
)
echo.

REM Instalar dependencias
echo [4/4] Instalando dependencias Python...
echo.
python -m pip install --upgrade pip >nul 2>&1
python -m pip install -r %REQ_FILE%
if %errorlevel% neq 0 (
    echo.
    echo ERRO: Falha ao instalar dependencias.
    echo.
    echo Tente executar manualmente:
    echo   pip install -r %REQ_FILE%
    echo.
    pause
    exit /b 1
)
echo.

REM Criar diretorios necessarios
if not exist "uploads" mkdir uploads
if not exist "results" mkdir results
if not exist "previews" mkdir previews

echo ========================================
echo  Iniciando servidor...
echo ========================================
echo.
echo A aplicacao estara disponivel em:
echo    http://127.0.0.1:8360
echo.
echo Pressione Ctrl+C para parar o servidor.
echo.

python app.py

