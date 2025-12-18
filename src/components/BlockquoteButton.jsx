import { useState, useRef, useEffect } from 'react';
import { Quote } from 'lucide-react';
import BlockquoteColorMenu from './BlockquoteColorMenu';

const BlockquoteButton = ({ editor, isActive, theme, createButton }) => {
  const [menuState, setMenuState] = useState({ isOpen: false, position: { x: 0, y: 0 } });
  const buttonRef = useRef(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation?.();
    
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuState({
        isOpen: true,
        position: { x: rect.right + 5, y: rect.top - 37 }
      });
    }
  };

  // Adicionar listener direto no botão após renderização
  useEffect(() => {
    const buttonElement = buttonRef.current?.querySelector('button');
    if (buttonElement) {
      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
          setMenuState({
            isOpen: true,
            position: { x: rect.right + 5, y: rect.top - 37 }
          });
        }
      };
      
      buttonElement.addEventListener('contextmenu', handler, true);
      return () => {
        buttonElement.removeEventListener('contextmenu', handler, true);
      };
    }
  }, []);

  useEffect(() => {
    if (!menuState.isOpen) {
      return;
    }

    const handleClickOutside = (event) => {
      const menuElement = document.querySelector('[data-blockquote-menu]');
      const isClickInsideButton = buttonRef.current?.contains(event.target);
      const isClickInsideMenu = menuElement?.contains(event.target);
      const isColorButton = event.target.closest('button[data-color-button]');

      if (isColorButton || isClickInsideButton) {
        return;
      }

      if (!isClickInsideMenu) {
        setMenuState({ isOpen: false, position: { x: 0, y: 0 } });
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [menuState.isOpen]);

  return (
    <div 
      ref={buttonRef} 
      data-blockquote-button
      onContextMenu={handleContextMenu} 
      style={{ WebkitAppRegion: 'no-drag', position: 'relative' }}
    >
      {createButton(
        () => editor.chain().focus().toggleBlockquote().run(),
        isActive,
        <Quote size={14} strokeWidth={2.5} />,
        'Citação (clique direito para cores)'
      )}
      {menuState.isOpen && (
        <BlockquoteColorMenu
          editor={editor}
          position={menuState.position}
          onClose={() => setMenuState({ isOpen: false, position: { x: 0, y: 0 } })}
        />
      )}
    </div>
  );
};

export default BlockquoteButton;
