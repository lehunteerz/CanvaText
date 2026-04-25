# Instalador (Windows)

Esta pasta destina-se a conter o **instalador NSIS** gerado pelo Electron para publicação (GitHub, partilha direta, etc.).

## Como gerar e copiar os ficheiros

1. Na raiz do projeto:
   ```bash
   npm install
   npm run build:win
   ```
2. O `electron-builder` escreve os artefactos em `dist/` (pasta na raiz, ignorada pelo git exceto o que documentares).
3. Copia para **esta pasta** `installer/` os ficheiros relevantes, tipicamente:
   - `CanvaText Setup <versão>.exe` — instalador (nome exacto depende da versão em `package.json`)
   - `CanvaText Setup <versão>.exe.blockmap` — opcional, útil para updates
   - `latest.yml` — opcional, se usares mecanismos de actualização automática

O nome exacto do `.exe` aparece no output do build; corresponde a `productName` + " Setup " + versão no `package.json`.

## Nota

- O ficheiro **`.exe` não entra no Git** (excede o limite de 100 MB do GitHub). Mantém a cópia local em `installer/` e publica o instalador como **ficheiro anexo** nas [GitHub Releases](https://docs.github.com/repositories/releasing-projects-on-github/managing-releases-in-a-repository).
- O ficheiro **`.blockmap`** pode ser versionado (é pequeno) e ajuda com updates; também podes deixar só o `.exe` na release.
