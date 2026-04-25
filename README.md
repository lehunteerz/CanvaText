# CanvaText

Aplicação **desktop** de notas em estilo *canvas* com **editor de texto rico**, pensada para organizar ideias, referências e texto com liberdade de posicionamento, exportação e extensão por **plugins**.

## Finalidades

- Oferecer um quadro (canvas) onde podes colocar e arrastar notas, com alternância para **vista em abas** quando preferires leitura linear.
- Proporcionar escrita com **formatação completa** (negrito, listas, código, tarefas, alinhamento, etc.) com base no ecossistema **Tiptap** / ProseMirror.
- Permitir **exportar** o trabalho (HTML, Markdown, JSON, entre outros) e manter **auto-guardar** e integração com o sistema de ficheiros via **Electron** (incluindo diálogos e pasta de documentos do utilizador).
- Abrir caminho a **extensões** pela arquitectura de **plugins** (exemplos no repositório).

## Stack tecnológica

| Camada | Tecnologias |
|--------|-------------|
| **Runtime desktop** | [Electron](https://www.electronjs.org/) (Chromium + Node) |
| **UI** | [React](https://react.dev/) 18, [Tailwind CSS](https://tailwindcss.com/), PostCSS, Autoprefixer |
| **Editor** | [Tiptap](https://tiptap.dev/) 2 (extensões: blocos, listas, código, cores, tarefas, *bubble/floating* menu, etc.) e `@tiptap/pm` (ProseMirror) |
| **Conteúdo** | [Marked](https://marked.js.org/), [Turndown](https://github.com/mixmark-io/turndown) |
| **Componentes** | [Lucide React](https://lucide.dev/) (ícones), [react-draggable](https://github.com/react-grid-layout/react-draggable), [re-resizable](https://github.com/bokuweb/re-resizable) |
| **Build** | [Vite](https://vitejs.dev/) 5, [`@vitejs/plugin-react`](https://github.com/vitejs/vite-plugin-react) |
| **Package desktop** | [electron-builder](https://www.electron.build/) — Windows (NSIS), macOS (DMG), Linux (AppImage), conforme `package.json` |

Detalhe das dependências: vê `package.json`.

## Requisitos de sistema

### Desenvolvimento (clonar e compilar)

- **Node.js** 18 ou superior  
- **npm** ou **yarn**  
- Espaço em disco para `node_modules` e artefactos de build (ordem de vários **GB** com dependências e Electron)

### Utilização (aplicação instalada)

Não existe um *teto* de hardware: quanto melhor a máquina, mais confortável para muitas notas e exportações. Valores abaixo são **indicativos** para a stack actual (Electron 28, app renderizada em Web).

| | **Especificação** |
|---|------------------|
| **Mínimo (indicativo)** | **Windows 10 ou 11 (64 bits)**; **4 GB RAM**; processador 64 bits recente; **~500 MB–1,5 GB** de espaço livre (aplicação, dados e ficheiros temporários) |
| **Recomendado** | **8 GB RAM** ou mais; **SSD**; resolução de ecrã comum. Melhor desempenho com muitas notas, canvas extenso e ficheiros grandes |
| **Outros SO** | Builds para **macOS** e **Linux** estão previstos no `package.json` (`build:mac`, `build:linux`); requisitos semelhantes na mesma geração de hardware |

> **Testes formais** em "hardware máximo" não são obrigatórios para aplicações desktop: se publicares, podes listar a máquina em que testaste (ex.: *validado em Windows 11, 16 GB RAM*).

## Histórico de versão

- Consulta o ficheiro [**CHANGELOG.md**](./CHANGELOG.md) para o que foi **adicionado** e **corrigido** por versão.

## Características (resumo)

- **Editor rico** (Tiptap) com formatação, listas, blocos de código, tarefas, etc.  
- **Modo canvas** e **modo abas**  
- **Plugins** (arquitectura extensível)  
- **Exportação** em vários formatos; **atalhos** de teclado; **auto-save**  

## Pré-requisitos

- Node.js 18+  
- npm ou yarn  

## Instalação (código)

```bash
git clone <url-do-repositório>
cd <pasta-do-clone>
npm install
```

## Uso

### Desenvolvimento (Vite + Electron)

```bash
npm run electron:dev
```

Inicia o servidor de desenvolvimento e a janela Electron.

### Build e instalador

- **Windows (NSIS):** `npm run build:win`  
- **macOS (DMG):** `npm run build:mac`  
- **Linux (AppImage):** `npm run build:linux`  

Os executáveis / instaladores são gerados em `dist/`. Para versionar ou partilhar o instalador Windows numa pasta dedicada, segue as instruções em [**installer/README.md**](./installer/README.md).

## Atalhos de teclado (exemplos)

- `Ctrl+N` — Nova nota  
- `Ctrl+O` — Abrir ficheiro  
- `Ctrl+S` / `Ctrl+Shift+S` — Guardar / Guardar como  
- `Ctrl+F` — Procurar notas  
- `Ctrl+Space` — Ajuda de atalhos  
- `Escape` — Fechar modais  
- `Ctrl+Tab` — Alternar canvas / abas  

## Estrutura do projecto (resumo)

```
.
├── electron/          # Processo principal (Electron)
├── src/               # Intervénio (React, hooks, plugins, utilitários)
├── public/            # Recursos estáticos
├── build/             # Ícones e recursos de empacotamento
├── installer/         # Onde podes colocar o .exe (ver installer/README.md)
├── dist/              # Saída de Vite e electron-builder (gerado; ignorado no git)
└── package.json
```

## Plugins

Exemplos e interfaces em `src/plugins/` (incl. exemplos em `src/plugins/examples/`).

## Licença

**MIT** — vê a declaração de licença no repositório, se existir ficheiro `LICENSE`.
