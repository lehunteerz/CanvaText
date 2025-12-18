# 🔌 Sistema de Plugins/Extensões - CanvaText

## 📋 Visão Geral

Sistema modular para adicionar funcionalidades ao CanvaText através de plugins/extensões. Permite que desenvolvedores criem e compartilhem funcionalidades customizadas.

## 🏗️ Arquitetura do Sistema

### Estrutura de Diretórios

```
src/
  plugins/
    core/
      PluginManager.js       # Gerenciador principal
      PluginLoader.js         # Carregador de plugins
      PluginRegistry.js       # Registro de plugins
    examples/
      word-counter/          # Exemplo: Contador de palavras
      markdown-preview/      # Exemplo: Preview Markdown
      dark-mode-toggle/      # Exemplo: Toggle de tema
    hooks/
      usePlugin.js           # Hook para usar plugins
```

## 🚀 Implementação Base

### 1. Interface de Plugin

**Arquivo: `src/plugins/core/PluginInterface.js`**

```javascript
/**
 * Interface base para todos os plugins
 */
export class Plugin {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.version = config.version;
    this.description = config.description;
    this.author = config.author;
    this.enabled = false;
  }

  /**
   * Chamado quando o plugin é ativado
   */
  activate(context) {
    this.enabled = true;
    console.log(`Plugin ${this.name} ativado`);
  }

  /**
   * Chamado quando o plugin é desativado
   */
  deactivate() {
    this.enabled = false;
    console.log(`Plugin ${this.name} desativado`);
  }

  /**
   * Retorna hooks do React que o plugin quer usar
   */
  getHooks() {
    return {};
  }

  /**
   * Retorna componentes que o plugin quer renderizar
   */
  getComponents() {
    return {};
  }

  /**
   * Retorna comandos que o plugin disponibiliza
   */
  getCommands() {
    return {};
  }
}
```

### 2. Plugin Manager

**Arquivo: `src/plugins/core/PluginManager.js`**

```javascript
import { Plugin } from './PluginInterface';

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.context = {
      notes: null,
      editor: null,
      app: null,
    };
  }

  /**
   * Registrar um plugin
   */
  register(pluginClass, config) {
    const plugin = new pluginClass(config);
    this.plugins.set(plugin.id, plugin);
    console.log(`Plugin registrado: ${plugin.name}`);
    return plugin;
  }

  /**
   * Ativar um plugin
   */
  activate(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (plugin && !plugin.enabled) {
      plugin.activate(this.context);
    }
  }

  /**
   * Desativar um plugin
   */
  deactivate(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (plugin && plugin.enabled) {
      plugin.deactivate();
    }
  }

  /**
   * Atualizar contexto (chamado quando estado do app muda)
   */
  updateContext(newContext) {
    this.context = { ...this.context, ...newContext };
  }

  /**
   * Obter todos os hooks dos plugins ativos
   */
  getActiveHooks() {
    const hooks = {};
    this.plugins.forEach(plugin => {
      if (plugin.enabled) {
        Object.assign(hooks, plugin.getHooks());
      }
    });
    return hooks;
  }

  /**
   * Obter todos os componentes dos plugins ativos
   */
  getActiveComponents() {
    const components = {};
    this.plugins.forEach(plugin => {
      if (plugin.enabled) {
        Object.assign(components, plugin.getComponents());
      }
    });
    return components;
  }

  /**
   * Executar comando de um plugin
   */
  executeCommand(pluginId, commandName, ...args) {
    const plugin = this.plugins.get(pluginId);
    if (plugin && plugin.enabled) {
      const commands = plugin.getCommands();
      const command = commands[commandName];
      if (command) {
        return command(...args);
      }
    }
  }
}

// Singleton
export const pluginManager = new PluginManager();
```

### 3. Hook para Usar Plugins

**Arquivo: `src/plugins/hooks/usePlugin.js`**

```javascript
import { useEffect, useState } from 'react';
import { pluginManager } from '../core/PluginManager';

/**
 * Hook para usar plugins no React
 */
export const usePlugin = (pluginId) => {
  const [plugin, setPlugin] = useState(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const p = pluginManager.plugins.get(pluginId);
    setPlugin(p);
    setIsActive(p?.enabled || false);
  }, [pluginId]);

  const activate = () => {
    pluginManager.activate(pluginId);
    setIsActive(true);
  };

  const deactivate = () => {
    pluginManager.deactivate(pluginId);
    setIsActive(false);
  };

  return {
    plugin,
    isActive,
    activate,
    deactivate,
  };
};
```

## 📦 Exemplos de Plugins

### Exemplo 1: Contador de Palavras

**Arquivo: `src/plugins/examples/word-counter/WordCounterPlugin.js`**

```javascript
import { Plugin } from '../../core/PluginInterface';
import { useEffect, useState } from 'react';

export class WordCounterPlugin extends Plugin {
  constructor() {
    super({
      id: 'word-counter',
      name: 'Contador de Palavras',
      version: '1.0.0',
      description: 'Mostra contagem de palavras e caracteres',
      author: 'CanvaText Team',
    });
  }

  activate(context) {
    super.activate(context);
    // Lógica de ativação
  }

  getComponents() {
    return {
      WordCounter: ({ editor }) => {
        const [stats, setStats] = useState({ words: 0, chars: 0 });

        useEffect(() => {
          if (!editor) return;

          const updateStats = () => {
            const text = editor.getText();
            const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
            const chars = text.length;
            setStats({ words, chars });
          };

          editor.on('update', updateStats);
          updateStats();

          return () => {
            editor.off('update', updateStats);
          };
        }, [editor]);

        return (
          <div className="px-3 py-1 text-xs text-gray-400 border-t border-white/5">
            {stats.words} palavras • {stats.chars} caracteres
          </div>
        );
      },
    };
  }
}
```

### Exemplo 2: Preview Markdown

**Arquivo: `src/plugins/examples/markdown-preview/MarkdownPreviewPlugin.js`**

```javascript
import { Plugin } from '../../core/PluginInterface';
import { useState } from 'react';

export class MarkdownPreviewPlugin extends Plugin {
  constructor() {
    super({
      id: 'markdown-preview',
      name: 'Preview Markdown',
      version: '1.0.0',
      description: 'Visualiza o conteúdo como Markdown renderizado',
      author: 'CanvaText Team',
    });
  }

  getComponents() {
    return {
      MarkdownPreview: ({ editor }) => {
        const [showPreview, setShowPreview] = useState(false);
        const [html, setHtml] = useState('');

        const togglePreview = () => {
          if (!showPreview && editor) {
            // Converter HTML do editor para Markdown e depois renderizar
            const markdown = this.htmlToMarkdown(editor.getHTML());
            setHtml(this.markdownToHtml(markdown));
          }
          setShowPreview(!showPreview);
        };

        return (
          <>
            <button onClick={togglePreview} className="px-2 py-1 text-xs">
              {showPreview ? 'Editar' : 'Preview'}
            </button>
            {showPreview && (
              <div 
                className="prose prose-invert max-w-none p-4"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}
          </>
        );
      },
    };
  }

  htmlToMarkdown(html) {
    // Implementar conversão HTML → Markdown
    return html;
  }

  markdownToHtml(markdown) {
    // Implementar conversão Markdown → HTML (usar biblioteca como marked)
    return markdown;
  }
}
```

### Exemplo 3: Tema Customizado

**Arquivo: `src/plugins/examples/custom-theme/CustomThemePlugin.js`**

```javascript
import { Plugin } from '../../core/PluginInterface';

export class CustomThemePlugin extends Plugin {
  constructor() {
    super({
      id: 'custom-theme',
      name: 'Tema Customizado',
      version: '1.0.0',
      description: 'Aplica tema personalizado',
      author: 'CanvaText Team',
    });
    this.theme = null;
  }

  activate(context) {
    super.activate(context);
    // Aplicar CSS customizado
    this.applyTheme();
  }

  deactivate() {
    super.deactivate();
    // Remover CSS customizado
    this.removeTheme();
  }

  applyTheme() {
    const style = document.createElement('style');
    style.id = 'custom-theme-styles';
    style.textContent = `
      :root {
        --bg-primary: #1a1a1a;
        --bg-secondary: #2d2d2d;
        --text-primary: #ffffff;
        --accent: #3b82f6;
      }
    `;
    document.head.appendChild(style);
  }

  removeTheme() {
    const style = document.getElementById('custom-theme-styles');
    if (style) {
      style.remove();
    }
  }
}
```

## 🔧 Integração no App

**Arquivo: `src/App.jsx` (exemplo de integração)**

```javascript
import { useEffect } from 'react';
import { pluginManager } from './plugins/core/PluginManager';
import { WordCounterPlugin } from './plugins/examples/word-counter/WordCounterPlugin';
import { MarkdownPreviewPlugin } from './plugins/examples/markdown-preview/MarkdownPreviewPlugin';

function App() {
  const notesState = useNotes();

  useEffect(() => {
    // Registrar plugins
    pluginManager.register(WordCounterPlugin);
    pluginManager.register(MarkdownPreviewPlugin);

    // Atualizar contexto
    pluginManager.updateContext({
      notes: notesState,
    });

    // Ativar plugins por padrão
    pluginManager.activate('word-counter');
  }, []);

  // Obter componentes dos plugins
  const pluginComponents = pluginManager.getActiveComponents();

  return (
    <div>
      {/* App normal */}
      
      {/* Renderizar componentes dos plugins */}
      {pluginComponents.WordCounter && (
        <pluginComponents.WordCounter editor={activeEditor} />
      )}
    </div>
  );
}
```

## 📝 API de Plugin

### Métodos Disponíveis

```javascript
class MeuPlugin extends Plugin {
  // Obrigatório
  activate(context) { }
  deactivate() { }

  // Opcional
  getHooks() {
    return {
      useMeuHook: () => { /* ... */ }
    };
  }

  getComponents() {
    return {
      MeuComponente: ({ props }) => <div>...</div>
    };
  }

  getCommands() {
    return {
      meuComando: (args) => { /* ... */ }
    };
  }
}
```

### Contexto Disponível

```javascript
context = {
  notes: useNotes(),        // Estado das notas
  editor: Editor,           // Editor Tiptap ativo
  app: AppInstance,         // Instância do app
  viewMode: 'canvas' | 'tabs',
}
```

## 🎯 Próximos Passos

1. Criar estrutura de pastas `src/plugins/`
2. Implementar `PluginManager` e `PluginInterface`
3. Criar hook `usePlugin`
4. Criar plugins de exemplo
5. Integrar no `App.jsx`
6. Criar UI para gerenciar plugins (ativar/desativar)
7. Sistema de carregamento dinâmico de plugins

## 💡 Ideias de Plugins

- **Exportadores**: PDF, DOCX, LaTeX
- **Integrações**: GitHub, Notion, Google Drive
- **Temas**: Dark, Light, Custom
- **Ferramentas**: Calculadora, Timer, Pomodoro
- **Análise**: Estatísticas de escrita, Análise de sentimento
- **Colaboração**: Compartilhamento, Comentários
- **IA**: Autocomplete, Correção gramatical

