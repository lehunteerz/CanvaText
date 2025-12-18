# ⌨️ Sistema de Atalhos de Teclado - CanvaText

## 📋 Visão Geral

O CanvaText já possui alguns atalhos básicos. Este documento explica como adicionar mais atalhos e criar um sistema centralizado de gerenciamento.

## 🎯 Atalhos Atuais

- **Shift+S**: Auto-save (backup automático)
- **Ctrl+Shift+S**: Exportar nota (Save As)
- **Ctrl+Backspace/Delete**: Deletar nota atual
- **Duplo Clique no Header**: Colapsar/Expandir nota

## 🚀 Implementação: Sistema Centralizado de Atalhos

### 1. Criar Hook Global de Atalhos

**Arquivo: `src/hooks/useKeyboardShortcuts.js`**

```javascript
import { useEffect } from 'react';

/**
 * Hook para gerenciar atalhos de teclado globais
 * @param {Object} shortcuts - Objeto com atalhos { 'Ctrl+N': callback, ... }
 * @param {boolean} enabled - Se os atalhos estão habilitados
 */
export const useKeyboardShortcuts = (shortcuts = {}, enabled = true) => {
  useEffect(() => {
    if (!enabled || Object.keys(shortcuts).length === 0) return;

    const handleKeyDown = (e) => {
      // Construir string do atalho (ex: "Ctrl+N", "Shift+S")
      const key = e.key;
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      let shortcutKey = '';
      
      if (ctrl) shortcutKey += 'Ctrl+';
      if (shift) shortcutKey += 'Shift+';
      if (alt) shortcutKey += 'Alt+';
      
      shortcutKey += key;

      // Verificar se existe handler para este atalho
      const handler = shortcuts[shortcutKey];
      
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
};

/**
 * Hook específico para atalhos de notas
 */
export const useNoteShortcuts = (notesState, viewMode) => {
  useKeyboardShortcuts({
    // Nova nota
    'Ctrl+N': (e) => {
      e.preventDefault();
      notesState.addNote();
    },
    
    // Duplicar nota atual (se houver nota selecionada)
    'Ctrl+D': (e) => {
      e.preventDefault();
      // Implementar lógica de duplicação
      console.log('Duplicar nota');
    },
    
    // Buscar em todas as notas
    'Ctrl+F': (e) => {
      e.preventDefault();
      // Abrir modal de busca
      console.log('Buscar notas');
    },
    
    // Alternar modo de visualização
    'Ctrl+Tab': (e) => {
      e.preventDefault();
      // Alternar entre Canvas e Tabs
      console.log('Alternar modo');
    },
    
    // Fechar nota atual
    'Ctrl+W': (e) => {
      e.preventDefault();
      // Fechar nota ativa (se em modo Tabs)
      console.log('Fechar nota');
    },
    
    // Nova nota rápida (sem focar)
    'Ctrl+Shift+N': (e) => {
      e.preventDefault();
      notesState.addNote();
    },
    
    // Colapsar todas as notas
    'Ctrl+Shift+C': (e) => {
      e.preventDefault();
      // Colapsar todas
      console.log('Colapsar todas');
    },
    
    // Expandir todas as notas
    'Ctrl+Shift+E': (e) => {
      e.preventDefault();
      // Expandir todas
      console.log('Expandir todas');
    },
  }, true);
};

/**
 * Hook para atalhos do editor Tiptap
 */
export const useEditorShortcuts = (editor, enabled = true) => {
  useKeyboardShortcuts({
    // Formatação rápida
    'Ctrl+B': (e) => {
      if (editor) {
        e.preventDefault();
        editor.chain().focus().toggleBold().run();
      }
    },
    
    'Ctrl+I': (e) => {
      if (editor) {
        e.preventDefault();
        editor.chain().focus().toggleItalic().run();
      }
    },
    
    'Ctrl+U': (e) => {
      if (editor) {
        e.preventDefault();
        editor.chain().focus().toggleUnderline().run();
      }
    },
    
    // Listas
    'Ctrl+Shift+L': (e) => {
      if (editor) {
        e.preventDefault();
        editor.chain().focus().toggleBulletList().run();
      }
    },
    
    'Ctrl+Shift+O': (e) => {
      if (editor) {
        e.preventDefault();
        editor.chain().focus().toggleOrderedList().run();
      }
    },
    
    // Títulos
    'Ctrl+1': (e) => {
      if (editor) {
        e.preventDefault();
        editor.chain().focus().toggleHeading({ level: 1 }).run();
      }
    },
    
    'Ctrl+2': (e) => {
      if (editor) {
        e.preventDefault();
        editor.chain().focus().toggleHeading({ level: 2 }).run();
      }
    },
    
    // Código
    'Ctrl+`': (e) => {
      if (editor) {
        e.preventDefault();
        editor.chain().focus().toggleCodeBlock().run();
      }
    },
  }, enabled && !!editor);
};
```

### 2. Usar no App.jsx

```javascript
import { useNoteShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  const notesState = useNotes();
  const [viewMode, setViewMode] = useState('canvas');
  
  // Ativar atalhos globais de notas
  useNoteShortcuts(notesState, viewMode);
  
  // ... resto do código
}
```

### 3. Usar no Note.jsx

```javascript
import { useEditorShortcuts } from '../hooks/useKeyboardShortcuts';

function Note({ ... }) {
  const editor = useEditor({ ... });
  
  // Ativar atalhos do editor quando a nota estiver focada
  useEditorShortcuts(editor, !isCollapsed);
  
  // ... resto do código
}
```

## 📝 Exemplos de Atalhos Úteis

### Navegação
- `Ctrl+Tab`: Alternar entre notas
- `Ctrl+PageUp/PageDown`: Navegar entre abas (modo Tabs)
- `Ctrl+Home`: Primeira nota
- `Ctrl+End`: Última nota

### Edição
- `Ctrl+Z`: Desfazer
- `Ctrl+Y`: Refazer
- `Ctrl+A`: Selecionar tudo
- `Ctrl+K`: Inserir link
- `Ctrl+/`: Comentário (se implementado)

### Visualização
- `F11`: Tela cheia
- `Ctrl+Plus`: Zoom in
- `Ctrl+Minus`: Zoom out
- `Ctrl+0`: Reset zoom

### Ações Rápidas
- `Ctrl+Shift+P`: Painel de comandos (palette)
- `Ctrl+,`: Configurações
- `Ctrl+?`: Mostrar todos os atalhos

## 🎨 Componente de Ajuda de Atalhos

Criar um modal que mostra todos os atalhos disponíveis:

```javascript
// src/components/ShortcutsHelp.jsx
import { X } from 'lucide-react';

const SHORTCUTS = {
  'Geral': [
    { keys: 'Ctrl+N', description: 'Nova nota' },
    { keys: 'Ctrl+D', description: 'Duplicar nota' },
    { keys: 'Ctrl+F', description: 'Buscar' },
    { keys: 'Ctrl+W', description: 'Fechar nota' },
  ],
  'Edição': [
    { keys: 'Ctrl+B', description: 'Negrito' },
    { keys: 'Ctrl+I', description: 'Itálico' },
    { keys: 'Ctrl+U', description: 'Sublinhado' },
    { keys: 'Ctrl+Z', description: 'Desfazer' },
  ],
  'Salvamento': [
    { keys: 'Shift+S', description: 'Auto-save (backup)' },
    { keys: 'Ctrl+Shift+S', description: 'Exportar nota' },
  ],
};

function ShortcutsHelp({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center">
      <div className="bg-neutral-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Atalhos de Teclado</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        {Object.entries(SHORTCUTS).map(([category, shortcuts]) => (
          <div key={category} className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">{category}</h3>
            {shortcuts.map(({ keys, description }) => (
              <div key={keys} className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/80">{description}</span>
                <kbd className="px-2 py-1 bg-neutral-800 rounded text-xs text-gray-300">
                  {keys}
                </kbd>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## ✅ Próximos Passos

1. Criar o hook `useKeyboardShortcuts.js`
2. Integrar no `App.jsx` e `Note.jsx`
3. Criar componente de ajuda (`ShortcutsHelp.jsx`)
4. Adicionar atalho `Ctrl+?` para abrir ajuda
5. Testar todos os atalhos

