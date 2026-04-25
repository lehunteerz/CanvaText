@echo off
chcp 65001 >nul
cd /d "%~dp0"
title CanvaText - gerar instalador .exe
echo Gera  CanvaText Setup ... .exe  na pasta  dist\  (demora).
echo.
where npm >nul 2>&1
if errorlevel 1 (
  echo Instala Node.js de https://nodejs.org
  pause
  exit /b 1
)
if not exist "node_modules\" (
  echo Corre primeiro: 1-Instalar-dependencias.bat
  pause
  exit /b 1
)
call npm run build:win
echo.
if errorlevel 1 ( echo Build com erros. ) else ( echo Abre a pasta  dist\  e procura o ficheiro .exe )
pause
