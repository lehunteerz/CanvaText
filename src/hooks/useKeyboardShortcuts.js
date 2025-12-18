import { useEffect } from 'react';

/**
 * Hook genérico para gerenciar atalhos de teclado globais
 * @param {Object} shortcuts - Objeto com atalhos { 'Ctrl+N': callback, ... }
 * @param {boolean} enabled - Se os atalhos estão habilitados
 */
export const useKeyboardShortcuts = (shortcuts = {}, enabled = true) => {
  useEffect(() => {
    if (!enabled || Object.keys(shortcuts).length === 0) return;

    const handleKeyDown = (e) => {
      // Construir string do atalho (ex: "Ctrl+N", "Shift+S", "Ctrl+Space")
      // Normalizar a tecla (maiúscula para consistência)
      let key = e.key;
      if (key === ' ') {
        key = ' '; // Space
      } else if (key.length === 1) {
        key = key.toUpperCase(); // Normalizar letras
      }
      
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      let shortcutKey = '';
      
      if (ctrl) shortcutKey += 'Ctrl+';
      if (shift) shortcutKey += 'Shift+';
      if (alt) shortcutKey += 'Alt+';
      
      // Para Space, usar ' ' na string do atalho
      shortcutKey += key === ' ' ? ' ' : key;

      // Verificar se existe handler para este atalho
      const handler = shortcuts[shortcutKey];
      
      if (handler) {
        e.preventDefault();
        e.stopPropagation(); // Impedir propagação
        handler(e);
        return;
      }
    };

    // Remover modo de captura para evitar conflitos com lógica de foco da janela
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
};

/**
 * Hook específico para atalhos de notas (globais)
 */
export const useNoteShortcuts = (notesState, viewMode, setViewMode, setShowSearchModal, openFileHandler) => {
  useKeyboardShortcuts({
    // Nova nota
    'Ctrl+N': (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Ctrl+N pressionado - criando nova nota');
      notesState.addNote();
    },
    
    // Duplicar primeira nota (se houver)
    'Ctrl+D': (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Ctrl+D pressionado - duplicando nota');
      if (notesState.notes.length > 0) {
        const firstNoteId = notesState.notes[0].id;
        notesState.duplicateNote(firstNoteId);
      }
    },
    
    // Buscar em todas as notas
    'Ctrl+F': (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Ctrl+F pressionado - abrindo busca');
      if (setShowSearchModal) {
        setShowSearchModal(true);
      }
    },
    
    // Abrir arquivo
    'Ctrl+O': (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Ctrl+O pressionado - abrindo arquivo');
      if (openFileHandler) {
        openFileHandler();
      }
    },
    
    // Alternar modo de visualização
    'Ctrl+Tab': (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (setViewMode) {
        setViewMode(prev => prev === 'canvas' ? 'tabs' : 'canvas');
      }
    },
    
    // Nova nota rápida (sem focar)
    'Ctrl+Shift+N': (e) => {
      e.preventDefault();
      e.stopPropagation();
      notesState.addNote();
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
    
    // Parágrafo
    'Ctrl+0': (e) => {
      if (editor) {
        e.preventDefault();
        editor.chain().focus().setParagraph().run();
      }
    },
    
    // Código
    'Ctrl+`': (e) => {
      if (editor) {
        e.preventDefault();
        editor.chain().focus().toggleCodeBlock().run();
      }
    },
    
    // Citação
    'Ctrl+Shift+Q': (e) => {
      if (editor) {
        e.preventDefault();
        editor.chain().focus().toggleBlockquote().run();
      }
    },
  }, enabled && !!editor);
};

