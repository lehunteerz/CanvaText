import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Quote } from 'lucide-react';

const COLOR_PALETTES = [
  { name: 'Azul', color: '#3b82f6', borderColor: '#2563eb' },
  { name: 'Verde', color: '#10b981', borderColor: '#059669' },
  { name: 'Roxo', color: '#8b5cf6', borderColor: '#7c3aed' },
  { name: 'Rosa', color: '#ec4899', borderColor: '#db2777' },
  { name: 'Laranja', color: '#f59e0b', borderColor: '#d97706' },
  { name: 'Vermelho', color: '#ef4444', borderColor: '#dc2626' },
  { name: 'Amarelo', color: '#eab308', borderColor: '#ca8a04' },
  { name: 'Ciano', color: '#06b6d4', borderColor: '#0891b2' },
  { name: 'Neutro', color: '#6b7280', borderColor: '#4b5563' },
];

const BlockquoteColorMenu = ({ editor, onClose, position = { x: 0, y: 0 } }) => {
  const [isOpen, setIsOpen] = useState(true);
  const menuRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Pequeno delay para evitar conflitos com o evento de contexto
    timeoutRef.current = setTimeout(() => {
      const handleClickOutside = (event) => {
        // Não fechar se clicar em um botão de cor ou dentro do menu
        if (event.target.closest('button[data-color-button]') || 
            event.target.closest('[data-blockquote-menu]')) {
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
        // Prevenir menu de contexto padrão apenas dentro do menu
        const menuElement = document.querySelector('[data-blockquote-menu]');
        if (menuElement && menuElement.contains(event.target)) {
          event.preventDefault();
          event.stopPropagation();
        }
      };

      // Usar capture phase para garantir que capturamos o evento primeiro
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

  const applyColor = (palette) => {
    if (!editor) return;
    
    const isBlockquote = editor.isActive('blockquote');
    
    if (!isBlockquote) {
      // Criar novo blockquote se não existir
      editor.chain().focus().toggleBlockquote().run();
    }
    
    // Aguardar um pouco para garantir que o blockquote foi criado
    setTimeout(() => {
      // Usar o comando customizado para atualizar os atributos no estado do editor
      try {
        const result = editor.chain()
          .focus()
          .setBlockquoteColor(palette.color, palette.borderColor)
          .run();
        
        if (!result) {
          // Fallback: usar setNodeMarkup diretamente via transaction
          const { selection, tr } = editor.state;
          const { $from } = selection;
          
          let depth = $from.depth;
          while (depth > 0) {
            const node = $from.node(depth);
            if (node.type.name === 'blockquote') {
              const pos = $from.before(depth);
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                color: palette.color,
                borderColor: palette.borderColor,
              });
              editor.view.dispatch(tr);
              break;
            }
            depth--;
          }
        }
      } catch (error) {
        console.error('Erro ao aplicar cor:', error);
      }
    }, 10);
    
    // Aplicar classe CSS e atributos via DOM como garantia
    // Usar classes CSS é mais confiável que estilos inline
    const applyStylesToDOM = () => {
      const blockquoteElements = document.querySelectorAll('.tiptap blockquote');
      blockquoteElements.forEach((blockquoteElement) => {
        // Remover classes de cor anteriores
        blockquoteElement.classList.remove(...Array.from(blockquoteElement.classList).filter(c => c.startsWith('blockquote-color-')));
        
        // Adicionar nova classe CSS baseada na cor
        const colorClass = `blockquote-color-${palette.color.replace('#', '')}`;
        blockquoteElement.classList.add(colorClass);
        
        // Aplicar atributos também (para fallback CSS)
        blockquoteElement.setAttribute('data-color', palette.color);
        blockquoteElement.setAttribute('data-border-color', palette.borderColor);
      });
    };
    
    // Aplicar após um pequeno delay para garantir que o comando foi executado
    setTimeout(() => {
      applyStylesToDOM();
      // Aplicar novamente após o editor atualizar
      setTimeout(applyStylesToDOM, 50);
    }, 20);
  };

  if (!isOpen) return null;

  const menuContent = (
    <div
      ref={menuRef}
      data-blockquote-menu
      className="bg-neutral-900 border border-white/10 rounded-lg shadow-2xl flex items-center justify-center gap-2"
      style={{ 
        WebkitAppRegion: 'no-drag',
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 999999,
        isolation: 'isolate',
        width: '385px',
        height: '76px',
        paddingTop: '7px',
        paddingBottom: '7px',
        paddingLeft: '0px',
        paddingRight: '0px',
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
      {COLOR_PALETTES.map((palette) => (
        <button
          key={palette.color}
          data-color-button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.nativeEvent?.stopImmediatePropagation) {
              e.nativeEvent.stopImmediatePropagation();
            }
            applyColor(palette);
          }}
          className="flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer select-none"
          style={{ WebkitAppRegion: 'no-drag' }}
          title={palette.name}
          onMouseDown={(e) => e.preventDefault()}
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-xs font-mono pointer-events-none select-none"
            style={{
              backgroundColor: palette.color,
              color: '#ffffff',
              borderColor: palette.borderColor,
            }}
          >
            {palette.name.charAt(0)}
          </div>
        </button>
      ))}
    </div>
  );

  // Renderizar usando portal diretamente no body para evitar problemas de z-index e pointer-events
  return createPortal(menuContent, document.body);
};

export default BlockquoteColorMenu;

