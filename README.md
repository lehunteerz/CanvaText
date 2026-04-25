# CanvaText

Aplicação **desktop** para notas em estilo *canvas* com editor de texto rico (Electron + React + Tiptap).

Este guia explica, **passo a passo**, como **instalar e usar** o programa, ou como **abrir o código** no computador se fores programador.

---

## 1) Só quero instalar o programa (utilizador)

Não precisas de clonar o repositório nem de instalar Node.js.

### Passo 1 — Ir às *Releases* do GitHub

1. Abre a página do repositório: **<https://github.com/lehunteerz/CanvaText>**
2. Clica no separador **Releases** (ou acede a `https://github.com/lehunteerz/CanvaText/releases`).

### Passo 2 — Descarregar o instalador

1. Escolhe a *release* da versão que quiseres (ex.: `v1.1.0`).
2. Na secção **Assets**, descarrega o ficheiro **`CanvaText Setup 1.1.0.exe`** (ou o `.exe` indicado nessa *release*).  
   - Não confundas com ficheiros `.blockmap` ou outro: o instalador acaba sempre em **`.exe`**.

> **Porquê o instalador não está “dentro” do código?** O ficheiro `.exe` costuma ter **mais de 100 MB**. O GitHub **não aceita** ficheiros tão grandes dentro do repositório. Por isso o executável fica anexado à **Release**, não no meio do código.

### Passo 3 — Instalar no Windows

1. Abre a pasta **Downloads** (ou onde tenhas guardado o `.exe`).
2. Clicas duas vezes em **`CanvaText Setup ... .exe`**.
3. Se o Windows (SmartScreen) disser “Aplicação desconhecida”, podes optar por **Mais informações** → **Executar mesmo assim** (se confiares no ficheiro).
4. Segue o assistente: escolhe a pasta de instalação se te for pedido, e conclui com **Concluir**.

### Passo 4 — Abrir o CanvaText

- No **Menu Iniciar**, procura **CanvaText** e abre, ou  
- Vai a **Ambiente de trabalho** e usa o atalho, se tiveres criado.

### Onde a app guarda ficheiros

- As notas e backups automáticos seguem a lógica da aplicação; em muitas configurações a pasta fica em **Documentos** (ex.: pasta relacionada com “CanvaText” no nome, conforme a versão).

---

## 2) Quero o código: abrir o projecto a partir do zip ou clone (programador / curioso)

Precisas de **Node.js** (versão **18 ou superior**). Descarrega o instalador LTS em **<https://nodejs.org>**, instala, e **reinicia** a consola (ou o computador) para o comando `npm` passar a existir.

### Opção A — Ficheiros `.bat` na raiz (Windows, passo a passo)

1. Tira a pasta do projecto (clone ou *Download ZIP* e extrai) para um sítio com caminho **sem caracteres estranhos** (recomendado: pastas com nome simples, ex.: `C:\projetos\CanvaText`).
2. Clica duas vezes em **`Inicio-CanvaText.bat`**. Abre-se um **menu**:
   - **1** — Instalar dependências (corre `npm install`; faz na **primeira vez** ou após clonar de novo).
   - **2** — Abrir o CanvaText em **modo desenvolvimento** (abre a app; mantém a janela a correr; fecha ao saires da aplicação).
   - **3** — Criar o **instalador Windows** (demora; gera o `.exe` na pasta `dist\`).
   - **4** — Abrir a pasta `dist\` no Explorador (útil após a opção 3).

Se a opção 1 disser que **npm** não foi encontrado, o Node.js não está instalado ou ainda não actualizou o *PATH* — volta ao início desta secção.

### Opção B — Comandos manuais (linha de comandos / PowerShell)

Na **raiz** da pasta do projecto (onde está o `package.json`):

| Objetivo | Comando |
|----------|--------|
| Instalar dependências (primeira vez) | `npm install` |
| Abrir a app em desenvolvimento | `npm run electron:dev` |
| Criar o instalador Windows (`.exe` em `dist\`) | `npm run build:win` |

O instalador `CanvaText Setup <versão>.exe` fica em **`dist\`**, com o nome e versão alinhados ao `package.json`.

### O que é o ficheiro `.blockmap` no repositório?

- É **pequeno** e é gerado com o *build*; serve para mecanismos de **atualização** (deltas) em ferramentas como o *electron-builder*.  
- **Não** é o instalador. Quem **só quer instalar** usa sempre o **`.exe`** anexado na **Release**.

---

## 3) Resumo

| O que queres fazer | O que fazer |
|--------------------|------------|
| **Só instalar o programa** | *Releases* → descarregar **`.exe`** → executar o instalador. |
| **Ver/editar o código e correr a app** | Instalar **Node 18+** → abrir a pasta do projecto → `Inicio-CanvaText.bat` opção 1, depois 2 (ou `npm install` e `npm run electron:dev`). |
| **Criar um `.exe` tu mesmo** | Opção 3 no `.bat` ou `npm run build:win` → ficheiro em `dist\`. Publicar o `.exe` nas *GitHub Releases* (não no ficheiro principal do repositório, se passar 100 MB). |

---

## Licença

MIT (ver ficheiro `package.json` / licença do repositório, se existir ficheiro `LICENSE` na raiz).
