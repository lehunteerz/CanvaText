# CanvaText

Aplicação de notas estilo canvas com editor rico de texto, construída com Electron, React e Vite.

## 🚀 Características

- **Editor Rico de Texto**: Baseado em Tiptap com suporte a formatação completa
- **Modo Canvas**: Arraste e organize suas notas livremente em um canvas
- **Modo Tabs**: Visualize suas notas em abas organizadas
- **Sistema de Plugins**: Arquitetura extensível para adicionar funcionalidades
- **Exportação**: Exporte suas notas em múltiplos formatos (HTML, Markdown, JSON, etc.)
- **Auto-save**: Salvamento automático das suas notas
- **Atalhos de Teclado**: Navegação rápida e eficiente

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd PureRef
```

2. Instale as dependências:
```bash
npm install
```

## 🎮 Como Usar

### Desenvolvimento

Para rodar em modo de desenvolvimento:

```bash
npm run electron:dev
```

Isso iniciará o servidor Vite e o Electron simultaneamente.

### Build

Para criar um executável:

**Windows:**
```bash
npm run build:win
```

**macOS:**
```bash
npm run build:mac
```

**Linux:**
```bash
npm run build:linux
```

## ⌨️ Atalhos de Teclado

- `Ctrl+N` - Nova nota
- `Ctrl+O` - Abrir arquivo
- `Ctrl+S` - Auto-salvar
- `Ctrl+Shift+S` - Salvar como...
- `Ctrl+F` - Buscar notas
- `Ctrl+Space` - Mostrar ajuda de atalhos
- `Escape` - Fechar modais
- `Ctrl+Tab` - Alternar entre modo Canvas e Tabs

## 📁 Estrutura do Projeto

```
PureRef/
├── electron/          # Código do Electron (main process)
├── src/               # Código React (renderer process)
│   ├── components/    # Componentes React
│   ├── hooks/         # Custom hooks
│   ├── contexts/      # Contextos React
│   ├── plugins/        # Sistema de plugins
│   └── utils/         # Utilitários
├── public/            # Arquivos estáticos
├── build/             # Ícones e recursos de build
└── dist/              # Build de produção
```

## 🔌 Sistema de Plugins

O projeto inclui um sistema de plugins extensível. Veja exemplos em `src/plugins/examples/`.

## 📝 Licença

MIT

## 👨‍💻 Desenvolvimento

Este projeto usa:
- **Electron** - Framework para aplicações desktop
- **React** - Biblioteca UI
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS
- **Tiptap** - Editor de texto rico
- **Lucide React** - Ícones

