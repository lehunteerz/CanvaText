@echo off
chcp 65001 >nul
cd /d "%~dp0"
title CanvaText - modo desenvolvimento
where npm >nul 2>&1
if errorlevel 1 (
  echo Instala Node.js de https://nodejs.org e volta a correr este ficheiro.
  pause
  exit /b 1
)
if not exist "node_modules\" (
  echo Corre primeiro: 1-Instalar-dependencias.bat
  pause
  exit /b 1
)
call npm run electron:dev
pause
