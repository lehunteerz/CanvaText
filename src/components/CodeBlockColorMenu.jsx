import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Temas de código populares
const CODE_THEMES = [
  { 
    name: 'Horizon', 
    className: 'code-theme-horizon',
    colors: {
      background: '#1C1E26',
      text: '#CBCED0',
      borderColor: '#6C6F93',
    }
  },
  { 
    name: 'Nord', 
    className: 'code-theme-nord',
    colors: {
      background: '#2E3440',
      text: '#D8DEE9',
      borderColor: '#616E88',
    }
  },
  { 
    name: 'Dracula Official', 
    className: 'code-theme-dracula',
    colors: {
      background: '#282A36',
      text: '#F8F8F2',
      borderColor: '#6272A4',
    }
  },
  { 
    name: 'One Dark Pro', 
    className: 'code-theme-onedark',
    colors: {
      background: '#282C34',
      text: '#ABB2BF',
      borderColor: '#5C6370',
    }
  },
];

const CodeBlockColorMenu = ({ editor, onClose, position = { x: 0, y: 0 } }) => {
  const [isOpen, setIsOpen] = useState(true);
  const menuRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    timeoutRef.current = setTimeout(() => {
      const handleClickOutside = (event) => {
        if (event.target.closest('button[data-theme-button]') || 
            event.target.closest('[data-code-theme-menu]')) {
          return;
        }
        
        const codeBlockButton = document.querySelector('[data-code-block-button]');
        if (codeBlockButton && codeBlockButton.contains(event.target)) {
          return;
        }
        
        const tiptapElement = document.querySelector('.tiptap');
        if (tiptapElement && tiptapElement.contains(event.target)) {
          return;
        }
        
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setIsOpen(false);
          onClose?.();
        }
      };

      const handleEscape = (event) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
          onClose?.();
        }
      };

      const handleContextMenu = (event) => {
        const menuElement = document.querySelector('[data-code-theme-menu]');
        if (menuElement && menuElement.contains(event.target)) {
          event.preventDefault();
          event.stopPropagation();
        }
      };

      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('keydown', handleEscape, true);
      document.addEventListener('contextmenu', handleContextMenu, true);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside, true);
        document.removeEventListener('keydown', handleEscape, true);
        document.removeEventListener('contextmenu', handleContextMenu, true);
      };
    }, 50);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, onClose]);

  const applyTheme = (theme) => {
    if (!editor) return;
    
    // Verificar se está dentro de um codeBlock
    const isCodeBlock = editor.isActive('codeBlock');
    
    // Se não está em um codeBlock, criar um primeiro
    if (!isCodeBlock) {
      editor.chain().focus().toggleCodeBlock().run();
      // Aguardar o codeBlock ser criado
      setTimeout(() => {
        applyThemeToCodeBlock(theme);
      }, 50);
    } else {
      // Aplicar imediatamente se já está em um codeBlock
      applyThemeToCodeBlock(theme);
    }
  };

  const applyThemeToCodeBlock = (theme) => {
    if (!editor) return;

    // Primeiro, atualizar o estado do editor
    try {
      // Verificar se está em um codeBlock
      const isCodeBlock = editor.isActive('codeBlock');
      
      if (isCodeBlock) {
        const success = editor.chain().focus().setCodeBlockTheme(theme.className).run();
        if (!success) {
          console.warn('Failed to set theme via editor command, trying DOM approach');
        }
      } else {
        console.warn('Not in a codeBlock, creating one first');
        editor.chain().focus().toggleCodeBlock().run();
        setTimeout(() => {
          editor.chain().focus().setCodeBlockTheme(theme.className).run();
        }, 50);
      }
    } catch (error) {
      console.error('Error setting theme:', error);
    }

    // Função robusta para aplicar tema no DOM
    const applyToDOM = () => {
      // Buscar TODOS os codeBlocks e aplicar o tema no que está ativo/selecionado
      const allCodeBlocks = document.querySelectorAll('.tiptap pre');
      
      if (allCodeBlocks.length === 0) return;
      
      // Tentar encontrar o codeBlock ativo pela seleção
      let activePre = null;
      try {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          let node = range.commonAncestorContainer;
          
          // Subir na árvore DOM até encontrar o <pre>
          while (node && node.nodeType !== 1) {
            node = node.parentNode;
          }
          
          if (node) {
            activePre = node.closest('pre');
          }
        }
      } catch (e) {
        // Ignorar erros
      }
      
      // Se encontrou um codeBlock ativo, aplicar nele
      if (activePre) {
        applyThemeToElement(activePre, theme);
      } else {
        // Se não encontrou, aplicar no último codeBlock (provavelmente o que foi criado)
        const lastCodeBlock = allCodeBlocks[allCodeBlocks.length - 1];
        if (lastCodeBlock) {
          applyThemeToElement(lastCodeBlock, theme);
        }
      }
      
      // Também aplicar em todos os codeBlocks que já têm tema aplicado
      allCodeBlocks.forEach((preElement) => {
        const hasTheme = preElement.getAttribute('data-code-theme') || 
                        Array.from(preElement.classList).some(c => c.startsWith('code-theme-'));
        
        if (hasTheme && preElement !== activePre) {
          applyThemeToElement(preElement, theme);
        }
      });
    };

    const applyThemeToElement = (preElement, theme) => {
      // Remover todas as classes de tema anteriores (exceto code-with-lines)
      const themeClasses = ['code-theme-horizon', 'code-theme-nord', 'code-theme-dracula', 'code-theme-onedark'];
      themeClasses.forEach(cls => {
        if (cls !== theme.className) {
          preElement.classList.remove(cls);
        }
      });
      
      // Adicionar nova classe CSS
      preElement.classList.add(theme.className);
      preElement.setAttribute('data-code-theme', theme.className);
      
      // Aplicar estilos inline FORÇADOS no <pre>
      preElement.style.setProperty('background-color', theme.colors.background, 'important');
      preElement.style.setProperty('color', theme.colors.text, 'important');
      
      // Aplicar estilos também no elemento <code> dentro do <pre>
      const codeElement = preElement.querySelector('code');
      if (codeElement) {
        codeElement.style.setProperty('background-color', 'transparent', 'important');
        codeElement.style.setProperty('color', theme.colors.text, 'important');
      }
    };

    // Aplicar imediatamente
    applyToDOM();
    
    // Aplicar após delays para garantir que o DOM foi atualizado
    setTimeout(applyToDOM, 10);
    setTimeout(applyToDOM, 50);
    setTimeout(applyToDOM, 100);
    setTimeout(applyToDOM, 200);
    setTimeout(applyToDOM, 500);
    
    // Reaplicar após atualização do editor
    const handleUpdate = () => {
      setTimeout(applyToDOM, 10);
      setTimeout(applyToDOM, 50);
    };
    
    editor.on('update', handleUpdate);
    setTimeout(() => {
      editor.off('update', handleUpdate);
    }, 1000);
  };

  if (!isOpen) return null;

  const menuContent = (
    <div
      ref={menuRef}
      data-code-theme-menu
      className="bg-neutral-900 border border-white/10 rounded-lg shadow-2xl p-1.5 flex items-center justify-center gap-2"
      style={{ 
        WebkitAppRegion: 'no-drag',
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 999999,
        isolation: 'isolate',
        width: '323px',
        height: '56px',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: '0px',
        marginRight: '0px',
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent?.stopImmediatePropagation) {
          e.nativeEvent.stopImmediatePropagation();
        }
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent?.stopImmediatePropagation) {
          e.nativeEvent.stopImmediatePropagation();
        }
      }}
    >
      {CODE_THEMES.map((theme) => (
        <button
          key={theme.className}
          data-theme-button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent?.stopImmediatePropagation) {
              e.nativeEvent.stopImmediatePropagation();
            }
            applyTheme(theme);
          }}
          className="flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer select-none"
          style={{ WebkitAppRegion: 'no-drag' }}
          title={theme.name}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-xs font-mono pointer-events-none select-none"
            style={{
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: theme.colors.borderColor,
            }}
          >
            {theme.name.charAt(0)}
          </div>
        </button>
      ))}
    </div>
  );

  // Renderizar usando portal diretamente no body para evitar problemas de z-index e pointer-events
  return createPortal(menuContent, document.body);
};

export default CodeBlockColorMenu;
