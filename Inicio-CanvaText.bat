@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title CanvaText - menu assistente
color 0B

:MENU
cls
echo.
echo  ========================================
echo   CanvaText - o que queres fazer?
echo  (pasta: %~dp0)
echo  ========================================
echo.
echo   1 - Instalar dependencias  [ npm install ]  (primeira vez)
echo   2 - Abrir o CanvaText     [ desenvolvimento ]
echo   3 - Criar instalador .exe  [ build Windows ]  (demora)
echo   4 - Abrir a pasta "dist"  (onde fica o .exe apos o passo 3)
echo   5 - Abrir instrucoes no GitHub (Releases) no browser
echo   0 - Sair
echo.
set /p OPCAO= Escolhe um numero (0-5) e carrega Enter: 

if "%OPCAO%"=="" goto MENU
if "%OPCAO%"=="0" exit /b 0
if "%OPCAO%"=="1" goto DEPS
if "%OPCAO%"=="2" goto DEV
if "%OPCAO%"=="3" goto BUILD
if "%OPCAO%"=="4" goto OPENDIST
if "%OPCAO%"=="5" goto GITHUB
echo Opcao invalida.
pause
goto MENU

:CHECKNPM
where npm >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERRO] O comando "npm" nao foi encontrado.
  echo  Instala o Node.js (versao 18 ou superior) a partir de: https://nodejs.org
  echo  Apos instalar, FECHA e volta a abrir este .bat  (ou reinicia o PC).
  echo.
  pause
  exit /b 1
)
exit /b 0

:DEPS
call :CHECKNPM
if errorlevel 1 exit /b 1
echo.
echo A instalar dependencias (pode demorar)...
call npm install
if errorlevel 1 (
  echo.
  echo [ERRO] npm install falhou. Ver a mensagem acima.
) else (
  echo.
  echo [OK] Dependencias instaladas. Agora podes escolher a opcao 2.
)
echo.
pause
goto MENU

:DEV
call :CHECKNPM
if errorlevel 1 exit /b 1
if not exist "node_modules\" (
  echo.
  echo Antes, corre a opcao 1  (Instalar dependencias).
  pause
  goto MENU
)
echo.
echo A abrir o CanvaText em modo desenvolvimento...
echo Fecha a aplicacao e esta janela depois, ou interrompe com Ctrl+C.
echo.
call npm run electron:dev
pause
goto MENU

:BUILD
call :CHECKNPM
if errorlevel 1 exit /b 1
if not exist "node_modules\" (
  echo.
  echo Antes, corre a opcao 1  (Instalar dependencias).
  pause
  goto MENU
)
if not exist "build\iconblue.ico" (
  echo [AVISO] Ficheiro "build\iconblue.ico" nao encontrado. O build pode falhar
  echo se os icones tiverem sido apagados. A pasta "build" deve conter os icones.
  echo.
  pause
)
echo.
echo A compilar o instalador Windows  (pode levar varios minutos)...
call npm run build:win
if errorlevel 1 (
  echo.
  echo [ERRO] Build falhou. Ver a mensagem acima.
) else (
  echo.
  echo [OK] Procura o ficheiro  CanvaText Setup  X.X.X.exe  em  dist\
  echo Opcao 4 abre essa pasta.
)
echo.
pause
goto MENU

:OPENDIST
if not exist "dist\" (
  echo A pasta "dist" ainda nao existe. Correr primeiro a opcao 3  (Criar instalador).
  pause
  goto MENU
)
start "" "dist\"
goto MENU

:GITHUB
start "" "https://github.com/lehunteerz/CanvaText/releases"
goto MENU
