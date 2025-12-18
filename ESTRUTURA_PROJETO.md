# Estrutura do Projeto PureRef/CanvaText

## Visão Geral
Aplicação Electron de notas estilo canvas com editor rico baseado em TipTap.

---

## 📁 Estrutura de Diretórios

```
PureRef/
├── build/                          # Arquivos de build e ícones
│   ├── icon.icns                   # Ícone macOS
│   ├── icon.ico                    # Ícone Windows
│   ├── icon.png                    # Ícone Linux
│   ├── icon.svg                    # Ícone SVG
│   ├── iconblue.ico                # Ícone alternativo Windows
│   └── README_ICONES.md            # Documentação dos ícones
│
├── dist/                           # Arquivos compilados e builds
│   ├── assets/                     # Assets compilados (JS, CSS)
│   │   ├── index-A-EW_E48.js
│   │   ├── index-Cz8aeutz.css
│   │   ├── react-vendor-BBJP35HY.js
│   │   ├── tiptap-vendor-B30j6apB.js
│   │   └── ui-vendor-CAFwuG9Q.js
│   ├── win-unpacked/               # Build Windows descompactado
│   ├── CanvaText Setup 1.0.2.exe  # Instalador Windows
│   ├── builder-debug.yml
│   ├── builder-effective-config.yaml
│   └── index.html
│
├── docs/                           # Documentação do projeto
│   ├── ATALHOS_TECLADO.md          # Documentação de atalhos de teclado
│   ├── browserwindow-config.md     # Configuração da janela do browser
│   ├── EDITOR_ANALYSIS_REPORT.md   # Análise do editor
│   ├── FASE2_IMPLEMENTATION_SUMMARY.md
│   ├── FRAME_FIXES_AND_PHASE3.md
│   ├── IMPLEMENTACAO_GUIDE.md      # Guia de implementação
│   └── PLUGINS_EXTENSOES.md        # Documentação de plugins
│
├── electron/                       # Código Electron (main process)
│   ├── main.js                     # Processo principal Electron
│   └── preload.cjs                 # Script de pré-carregamento
│
├── MARKT/                          # Arquivos de marketing/imagens
│   ├── markt pronto/               # Mockups prontos
│   └── [várias capturas de tela]
│
├── public/                         # Arquivos públicos estáticos
│   ├── icon.ico
│   └── iconblue.ico
│
├── src/                            # Código-fonte principal
│   ├── components/                 # Componentes React
│   │   ├── BlockquoteButton.jsx
│   │   ├── BlockquoteColorMenu.jsx
│   │   ├── CodeBlockButton.jsx
│   │   ├── CodeBlockColorMenu.jsx
│   │   ├── ContextMenu.jsx
│   │   ├── DownloadsHistoryModal.jsx
│   │   ├── DrawingCanvas.jsx
│   │   ├── DrawingToolsPanel.jsx
│   │   ├── EditorSidePanel.jsx
│   │   ├── EditorToolbar.jsx
│   │   ├── EditorView.jsx
│   │   ├── EditorZoomControls.jsx
│   │   ├── ExportMenu.jsx
│   │   ├── Header.jsx
│   │   ├── Note.jsx
│   │   ├── NoteCanvas.jsx
│   │   ├── RenameContextMenu.jsx
│   │   ├── SearchModal.jsx
│   │   ├── SelectionPopup.jsx
│   │   ├── ShortcutsHelp.jsx
│   │   ├── StartScreen.jsx
│   │   ├── TabbedView.jsx
│   │   ├── TitleBar.jsx
│   │   ├── Toast.jsx
│   │   └── ToastContainer.jsx
│   │
│   ├── contexts/                   # Contextos React (estado global)
│   │   ├── DrawingContext.jsx      # Contexto para funcionalidades de desenho
│   │   ├── ThemeContext.jsx        # Contexto de tema
│   │   └── ToastContext.jsx        # Contexto para notificações toast
│   │
│   ├── extensions/                 # Extensões TipTap customizadas
│   │   ├── BlockquoteWithColor.js  # Extensão de blockquote com cores
│   │   └── CodeBlockWithTheme.js   # Extensão de code block com temas
│   │
│   ├── hooks/                      # Custom hooks React
│   │   ├── useBlockquoteColorObserver.js
│   │   ├── useCodeBlockLineNumbers.js
│   │   ├── useCodeBlockThemeObserver.js
│   │   ├── useDrawingKeyboardShortcuts.js
│   │   ├── useExportShortcut.js
│   │   ├── useKeyboardShortcuts.js
│   │   ├── useNotes.js
│   │   ├── usePlugin.js
│   │   ├── useSpellCheckContextMenu.js
│   │   └── useToast.js
│   │
│   ├── plugins/                    # Sistema de plugins
│   │   ├── core/                   # Core do sistema de plugins
│   │   │   ├── PluginInterface.js  # Interface base para plugins
│   │   │   └── PluginManager.js    # Gerenciador de plugins
│   │   └── examples/               # Plugins de exemplo
│   │       ├── spellcheck/         # Plugin de correção ortográfica
│   │       │   ├── SpellCheckComponent.jsx
│   │       │   └── SpellCheckPlugin.js
│   │       ├── translation/        # Plugin de tradução
│   │       │   ├── TranslationComponent.jsx
│   │       │   └── TranslationPlugin.js
│   │       └── word-counter/       # Plugin contador de palavras
│   │           ├── WordCounterComponent.jsx
│   │           └── WordCounterPlugin.js
│   │
│   ├── utils/                      # Funções utilitárias
│   │   ├── exportCanvas.js         # Utilitários de exportação de canvas
│   │   ├── exportUtils.js          # Utilitários gerais de exportação
│   │   ├── fileUtils.js            # Utilitários de manipulação de arquivos
│   │   ├── openFileUtils.js        # Utilitários de abertura de arquivos
│   │   └── throttle.js             # Função de throttle
│   │
│   ├── App.css                     # Estilos do componente App
│   ├── App.jsx                     # Componente principal da aplicação
│   ├── index.css                   # Estilos globais
│   └── main.jsx                    # Ponto de entrada da aplicação React
│
├── compose.debug.yaml              # Configuração Docker (debug)
├── compose.yaml                    # Configuração Docker
├── Dockerfile                      # Dockerfile para containerização
├── gerar-estrutura-seguro.bat     # Script batch para gerar estrutura
├── index.html                      # HTML principal
├── package.json                    # Configuração npm e dependências
├── postcss.config.js               # Configuração PostCSS
├── README.md                       # README principal do projeto
└── tailwind.config.js              # Configuração Tailwind CSS
└── vite.config.js                  # Configuração Vite
```

---

## 📦 Principais Dependências

### Dependências de Produção
- **@tiptap/\*** - Editor de texto rico TipTap e suas extensões
- **react** / **react-dom** - Framework React
- **react-draggable** - Componentes arrastáveis
- **re-resizable** - Componentes redimensionáveis
- **lucide-react** - Ícones
- **marked** - Parser Markdown
- **turndown** - Conversor HTML para Markdown

### Dependências de Desenvolvimento
- **electron** - Framework Electron
- **electron-builder** - Build de aplicações Electron
- **vite** - Build tool
- **tailwindcss** - Framework CSS
- **@vitejs/plugin-react** - Plugin React para Vite
- **concurrently** - Execução paralela de comandos
- **wait-on** - Aguardar recursos ficarem disponíveis

---

## 🎯 Componentes Principais

### Componentes de Editor
- `EditorView.jsx` - Visualização principal do editor
- `EditorToolbar.jsx` - Barra de ferramentas do editor
- `EditorSidePanel.jsx` - Painel lateral do editor
- `EditorZoomControls.jsx` - Controles de zoom

### Componentes de Notas
- `Note.jsx` - Componente de nota individual
- `NoteCanvas.jsx` - Canvas para notas
- `TabbedView.jsx` - Visualização com abas

### Componentes de Desenho
- `DrawingCanvas.jsx` - Canvas para desenho
- `DrawingToolsPanel.jsx` - Painel de ferramentas de desenho

### Componentes de UI
- `Header.jsx` - Cabeçalho da aplicação
- `TitleBar.jsx` - Barra de título
- `StartScreen.jsx` - Tela inicial
- `ContextMenu.jsx` - Menu de contexto
- `RenameContextMenu.jsx` - Menu de renomeação
- `SelectionPopup.jsx` - Popup de seleção
- `SearchModal.jsx` - Modal de busca
- `ExportMenu.jsx` - Menu de exportação
- `DownloadsHistoryModal.jsx` - Modal de histórico de downloads
- `ShortcutsHelp.jsx` - Ajuda de atalhos
- `Toast.jsx` / `ToastContainer.jsx` - Sistema de notificações

### Componentes de Formatação
- `BlockquoteButton.jsx` / `BlockquoteColorMenu.jsx` - Botões e menus de blockquote
- `CodeBlockButton.jsx` / `CodeBlockColorMenu.jsx` - Botões e menus de code block

---

## 🔧 Hooks Customizados

- `useNotes.js` - Gerenciamento de notas
- `useKeyboardShortcuts.js` - Atalhos de teclado gerais
- `useDrawingKeyboardShortcuts.js` - Atalhos para desenho
- `useExportShortcut.js` - Atalho de exportação
- `usePlugin.js` - Integração com plugins
- `useToast.js` - Sistema de toast
- `useBlockquoteColorObserver.js` - Observador de cores de blockquote
- `useCodeBlockThemeObserver.js` - Observador de temas de code block
- `useCodeBlockLineNumbers.js` - Números de linha em code blocks
- `useSpellCheckContextMenu.js` - Menu de contexto de correção ortográfica

---

## 🎨 Contextos (Estado Global)

- **DrawingContext** - Gerencia estado e funcionalidades de desenho
- **ThemeContext** - Gerencia tema da aplicação
- **ToastContext** - Gerencia notificações toast

---

## 🔌 Sistema de Plugins

### Core
- `PluginInterface.js` - Interface base que todos os plugins devem implementar
- `PluginManager.js` - Gerenciador central de plugins

### Plugins de Exemplo
1. **Spell Check** - Correção ortográfica
2. **Translation** - Tradução de texto
3. **Word Counter** - Contador de palavras

---

## 🛠️ Utilitários

- `fileUtils.js` - Operações com arquivos
- `openFileUtils.js` - Abertura de arquivos
- `exportUtils.js` - Exportação geral
- `exportCanvas.js` - Exportação específica de canvas
- `throttle.js` - Função de throttle para performance

---

## 📝 Scripts Disponíveis

```json
{
  "dev": "vite",                                    // Desenvolvimento
  "build": "vite build",                            // Build de produção
  "preview": "vite preview",                        // Preview do build
  "electron": "electron .",                         // Executar Electron
  "electron:dev": "concurrently ...",               // Dev com Electron
  "build:electron": "npm run build && electron-builder",
  "build:win": "npm run build && electron-builder --win",
  "build:mac": "npm run build && electron-builder --mac",
  "build:linux": "npm run build && electron-builder --linux"
}
```

---

## 🏗️ Arquitetura

### Stack Tecnológico
- **Frontend**: React 18 + Vite
- **Desktop**: Electron 28
- **Editor**: TipTap 2.x
- **Estilização**: Tailwind CSS
- **Build**: Electron Builder

### Estrutura de Dados
- Notas organizadas em canvas estilo PureRef
- Sistema de abas para múltiplas notas
- Suporte a desenho e anotações
- Editor rico com TipTap

---

## 📄 Arquivos de Configuração

- `package.json` - Dependências e scripts
- `vite.config.js` - Configuração Vite
- `tailwind.config.js` - Configuração Tailwind
- `postcss.config.js` - Configuração PostCSS
- `electron/main.js` - Configuração Electron
- `compose.yaml` / `compose.debug.yaml` - Docker Compose
- `Dockerfile` - Configuração Docker

---

## 📚 Documentação

Toda a documentação está disponível na pasta `docs/`:
- Atalhos de teclado
- Configuração do browser window
- Análise do editor
- Guias de implementação
- Documentação de plugins

---

**Última atualização**: Estrutura baseada no estado atual do projeto

