@echo off
chcp 65001 >nul
cd /d "%~dp0"
title CanvaText - instalar dependencias
echo Instalar dependencias (npm install) na pasta:
echo %cd%
echo.
where npm >nul 2>&1
if errorlevel 1 (
  echo Erro: Node.js / npm nao encontrado. Instala Node 18+ de https://nodejs.org
  pause
  exit /b 1
)
call npm install
echo.
if errorlevel 1 ( echo Falhou. ) else ( echo Concluido. )
pause
