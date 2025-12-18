@echo off
chcp 65001 >nul
cls

echo ═══════════════════════════════════════════════
echo  📁 LEITOR DE ESTRUTURA DE PROJETO
echo  ⚠️  MODO SEGURO - NÃO APAGA NADA!
echo ═══════════════════════════════════════════════
echo.
echo 🔍 Analisando arquivos na pasta...
echo 📂 Diretório: %cd%
echo.

REM Define o nome do arquivo de saída
set OUTPUT=ESTRUTURA-PROJETO.md

REM Inicia o arquivo (sobrescreve se já existir, mas não apaga outros arquivos)
echo # 📂 Estrutura do Projeto > "%OUTPUT%"
echo. >> "%OUTPUT%"
echo **📅 Data:** %date% às %time% >> "%OUTPUT%"
echo **📂 Caminho:** `%cd%` >> "%OUTPUT%"
echo. >> "%OUTPUT%"
echo ^> ⚠️ **Este arquivo foi gerado automaticamente. Os arquivos originais não foram modificados.** >> "%OUTPUT%"
echo. >> "%OUTPUT%"
echo --- >> "%OUTPUT%"
echo. >> "%OUTPUT%"

REM Conta todos os arquivos
echo 🔢 Contando arquivos...
setlocal enabledelayedexpansion
set /a total=0
for /r %%f in (*.*) do (
    set /a total+=1
)

echo ## 📊 Resumo Geral >> "%OUTPUT%"
echo. >> "%OUTPUT%"
echo - **Total de arquivos encontrados:** %total% >> "%OUTPUT%"
echo - **Data da análise:** %date% às %time% >> "%OUTPUT%"
echo. >> "%OUTPUT%"

endlocal

REM Gera a árvore completa
echo 📝 Gerando árvore de arquivos...
echo --- >> "%OUTPUT%"
echo. >> "%OUTPUT%"
echo ## 🌳 Árvore Completa de Arquivos e Pastas >> "%OUTPUT%"
echo. >> "%OUTPUT%"
echo ```txt >> "%OUTPUT%"
tree /F /A >> "%OUTPUT%"
echo ``` >> "%OUTPUT%"
echo. >> "%OUTPUT%"

REM Lista TODOS os arquivos com caminho completo
echo 📋 Listando todos os arquivos...
echo --- >> "%OUTPUT%"
echo. >> "%OUTPUT%"
echo ## 📄 Lista Completa de Arquivos >> "%OUTPUT%"
echo. >> "%OUTPUT%"

REM Agrupa por tipo de arquivo
echo ### 🌐 Arquivos Web (HTML, CSS, JS) >> "%OUTPUT%"
echo. >> "%OUTPUT%"
setlocal enabledelayedexpansion
set found=0
for /r %%f in (*.html *.htm *.css *.js) do (
    set found=1
    set "filepath=%%f"
    set "filepath=!filepath:%cd%\=!"
    set "ext=%%~xf"
    
    if /i "!ext!"==".html" set "icon=📄"
    if /i "!ext!"==".htm" set "icon=📄"
    if /i "!ext!"==".css" set "icon=🎨"
    if /i "!ext!"==".js" set "icon=⚡"
    
    echo !icon! `!filepath!` >> "%OUTPUT%"
)
if !found!==0 echo _Nenhum arquivo web encontrado_ >> "%OUTPUT%"
echo. >> "%OUTPUT%"
endlocal

echo ### 🐘 Arquivos PHP >> "%OUTPUT%"
echo. >> "%OUTPUT%"
setlocal enabledelayedexpansion
set found=0
for /r %%f in (*.php) do (
    set found=1
    set "filepath=%%f"
    set "filepath=!filepath:%cd%\=!"
    echo 🐘 `!filepath!` >> "%OUTPUT%"
)
if !found!==0 echo _Nenhum arquivo PHP encontrado_ >> "%OUTPUT%"
echo. >> "%OUTPUT%"
endlocal

echo ### ⚙️ Arquivos de Configuração >> "%OUTPUT%"
echo. >> "%OUTPUT%"
setlocal enabledelayedexpansion
set found=0
for /r %%f in (*.json *.xml *.yml *.yaml *.config *.ini .env .htaccess) do (
    set found=1
    set "filepath=%%f"
    set "filepath=!filepath:%cd%\=!"
    echo ⚙️ `!filepath!` >> "%OUTPUT%"
)
if !found!==0 echo _Nenhum arquivo de configuração encontrado_ >> "%OUTPUT%"
echo. >> "%OUTPUT%"
endlocal

echo ### 🖼️ Imagens e Mídia >> "%OUTPUT%"
echo. >> "%OUTPUT%"
setlocal enabledelayedexpansion
set found=0
for /r %%f in (*.png *.jpg *.jpeg *.gif *.svg *.ico *.webp *.bmp *.mp4 *.mp3 *.wav) do (
    set found=1
    set "filepath=%%f"
    set "filepath=!filepath:%cd%\=!"
    set "ext=%%~xf"
    
    if /i "!ext!"==".png" set "icon=🖼️"
    if /i "!ext!"==".jpg" set "icon=🖼️"
    if /i "!ext!"==".jpeg" set "icon=🖼️"
    if /i "!ext!"==".gif" set "icon=🖼️"
    if /i "!ext!"==".svg" set "icon=🎨"
    if /i "!ext!"==".ico" set "icon=⭐"
    if /i "!ext!"==".webp" set "icon=🖼️"
    if /i "!ext!"==".bmp" set "icon=🖼️"
    if /i "!ext!"==".mp4" set "icon=🎬"
    if /i "!ext!"==".mp3" set "icon=🎵"
    if /i "!ext!"==".wav" set "icon=🎵"
    
    echo !icon! `!filepath!` >> "%OUTPUT%"
)
if !found!==0 echo _Nenhuma imagem ou mídia encontrada_ >> "%OUTPUT%"
echo. >> "%OUTPUT%"
endlocal

echo ### 🔤 Fontes >> "%OUTPUT%"
echo. >> "%OUTPUT%"
setlocal enabledelayedexpansion
set found=0
for /r %%f in (*.ttf *.otf *.woff *.woff2 *.eot) do (
    set found=1
    set "filepath=%%f"
    set "filepath=!filepath:%cd%\=!"
    echo 🔤 `!filepath!` >> "%OUTPUT%"
)
if !found!==0 echo _Nenhuma fonte encontrada_ >> "%OUTPUT%"
echo. >> "%OUTPUT%"
endlocal

echo ### 📝 Documentação >> "%OUTPUT%"
echo. >> "%OUTPUT%"
setlocal enabledelayedexpansion
set found=0
for /r %%f in (*.md *.txt *.pdf *.doc *.docx) do (
    set found=1
    set "filepath=%%f"
    set "filepath=!filepath:%cd%\=!"
    set "ext=%%~xf"
    
    if /i "!ext!"==".md" set "icon=📝"
    if /i "!ext!"==".txt" set "icon=📄"
    if /i "!ext!"==".pdf" set "icon=📕"
    if /i "!ext!"==".doc" set "icon=📘"
    if /i "!ext!"==".docx" set "icon=📘"
    
    echo !icon! `!filepath!` >> "%OUTPUT%"
)
if !found!==0 echo _Nenhum arquivo de documentação encontrado_ >> "%OUTPUT%"
echo. >> "%OUTPUT%"
endlocal

echo ### 📦 Outros Arquivos >> "%OUTPUT%"
echo. >> "%OUTPUT%"
setlocal enabledelayedexpansion
set found=0
for /r %%f in (*.*) do (
    set "ext=%%~xf"
    set "name=%%~nxf"
    
    REM Ignora extensões já listadas
    if /i not "!ext!"==".html" if /i not "!ext!"==".htm" if /i not "!ext!"==".css" if /i not "!ext!"==".js" if /i not "!ext!"==".php" if /i not "!ext!"==".json" if /i not "!ext!"==".xml" if /i not "!ext!"==".yml" if /i not "!ext!"==".yaml" if /i not "!ext!"==".ini" if /i not "!ext!"==".png" if /i not "!ext!"==".jpg" if /i not "!ext!"==".jpeg" if /i not "!ext!"==".gif" if /i not "!ext!"==".svg" if /i not "!ext!"==".ico" if /i not "!ext!"==".webp" if /i not "!ext!"==".bmp" if /i not "!ext!"==".ttf" if /i not "!ext!"==".otf" if /i not "!ext!"==".woff" if /i not "!ext!"==".woff2" if /i not "!ext!"==".eot" if /i not "!ext!"==".md" if /i not "!ext!"==".txt" if /i not "!ext!"==".pdf" if /i not "!ext!"==".mp4" if /i not "!ext!"==".mp3" if /i not "!ext!"==".wav" if /i not "!name!"=="ESTRUTURA-PROJETO.md" if /i not "!ext!"==".bat" (
        set found=1
        set "filepath=%%f"
        set "filepath=!filepath:%cd%\=!"
        echo 📄 `!filepath!` >> "%OUTPUT%"
    )
)
if !found!==0 echo _Nenhum outro arquivo encontrado_ >> "%OUTPUT%"
echo. >> "%OUTPUT%"
endlocal

REM Estatísticas detalhadas por tipo
echo 📊 Gerando estatísticas...
echo --- >> "%OUTPUT%"
echo. >> "%OUTPUT%"
echo ## 📈 Estatísticas Detalhadas >> "%OUTPUT%"
echo. >> "%OUTPUT%"

setlocal enabledelayedexpansion
set /a html=0
set /a css=0
set /a js=0
set /a php=0
set /a img=0
set /a json=0
set /a md=0

for /r %%f in (*.*) do (
    set "ext=%%~xf"
    if /i "!ext!"==".html" set /a html+=1
    if /i "!ext!"==".htm" set /a html+=1
    if /i "!ext!"==".css" set /a css+=1
    if /i "!ext!"==".js" set /a js+=1
    if /i "!ext!"==".php" set /a php+=1
    if /i "!ext!"==".png" set /a img+=1
    if /i "!ext!"==".jpg" set /a img+=1
    if /i "!ext!"==".jpeg" set /a img+=1
    if /i "!ext!"==".gif" set /a img+=1
    if /i "!ext!"==".svg" set /a img+=1
    if /i "!ext!"==".json" set /a json+=1
    if /i "!ext!"==".md" set /a md+=1
)

echo ^| Tipo de Arquivo ^| Quantidade ^| >> "%OUTPUT%"
echo ^|------------------|------------^| >> "%OUTPUT%"
echo ^| 📄 HTML ^| !html! ^| >> "%OUTPUT%"
echo ^| 🎨 CSS ^| !css! ^| >> "%OUTPUT%"
echo ^| ⚡ JavaScript ^| !js! ^| >> "%OUTPUT%"
echo ^| 🐘 PHP ^| !php! ^| >> "%OUTPUT%"
echo ^| 🖼️ Imagens ^| !img! ^| >> "%OUTPUT%"
echo ^| 📋 JSON ^| !json! ^| >> "%OUTPUT%"
echo ^| 📝 Markdown ^| !md! ^| >> "%OUTPUT%"

endlocal

echo. >> "%OUTPUT%"
echo --- >> "%OUTPUT%"
echo. >> "%OUTPUT%"
echo ## ✅ Conclusão >> "%OUTPUT%"
echo. >> "%OUTPUT%"
echo ✨ Análise concluída com sucesso! >> "%OUTPUT%"
echo. >> "%OUTPUT%"
echo 🔒 **Nenhum arquivo foi modificado ou apagado.** >> "%OUTPUT%"
echo 📄 Este relatório foi salvo em: `ESTRUTURA-PROJETO.md` >> "%OUTPUT%"
echo. >> "%OUTPUT%"
echo --- >> "%OUTPUT%"
echo. >> "%OUTPUT%"
echo _Gerado por: gerar-estrutura-seguro.bat em %date% às %time%_ >> "%OUTPUT%"

REM Sucesso
cls
echo.
echo ═══════════════════════════════════════════════
echo  ✅ ESTRUTURA GERADA COM SUCESSO!
echo ═══════════════════════════════════════════════
echo.
echo 📄 Arquivo criado: %OUTPUT%
echo 📂 Localização: %cd%
echo.
echo 🔒 MODO SEGURO: Nenhum arquivo foi apagado!
echo ✅ Apenas leitura e geração de relatório.
echo.
echo Pressione qualquer tecla para abrir o relatório...
pause >nul

REM Abre o arquivo
start "" "%OUTPUT%"
