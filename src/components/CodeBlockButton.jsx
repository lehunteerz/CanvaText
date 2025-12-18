import { useState, useRef, useEffect } from 'react';
import { Code } from 'lucide-react';
import CodeBlockColorMenu from './CodeBlockColorMenu';

const CodeBlockButton = ({ editor, isActive, theme, createButton }) => {
  const [menuState, setMenuState] = useState({ isOpen: false, position: { x: 0, y: 0 } });
  const buttonRef = useRef(null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation?.();
    
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      // Sempre abrir/atualizar o menu, mesmo se já estiver aberto
      setMenuState({
        isOpen: true,
        position: { x: rect.right + 5, y: rect.top }
      });
    }
  };

  useEffect(() => {
    if (!menuState.isOpen) {
      // Limpar qualquer listener pendente quando o menu está fechado
      return;
    }

    const handleClickOutside = (event) => {
      const menuElement = document.querySelector('[data-code-theme-menu]');
      const isClickInsideButton = buttonRef.current?.contains(event.target);
      const isClickInsideMenu = menuElement?.contains(event.target);
      const isThemeButton = event.target.closest('button[data-theme-button]');

      // Não fechar se clicar em um botão de tema ou no próprio botão
      if (isThemeButton || isClickInsideButton) {
        return;
      }

      // Fechar apenas se clicar fora do menu e do botão
      if (!isClickInsideMenu) {
        setMenuState({ isOpen: false, position: { x: 0, y: 0 } });
      }
    };

    // Usar timeout para evitar conflitos com o evento de contexto
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      // Remover listener quando o componente desmontar ou o menu fechar
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [menuState.isOpen]);

  return (
    <div 
      ref={buttonRef} 
      data-code-block-button
      onContextMenu={handleContextMenu} 
      style={{ WebkitAppRegion: 'no-drag', position: 'relative' }}
    >
      {createButton(
        () => editor.chain().focus().toggleCodeBlock().run(),
        isActive,
        <Code size={14} strokeWidth={2.5} />,
        'Bloco de código (clique direito para temas)'
      )}
      {menuState.isOpen && (
        <CodeBlockColorMenu
          editor={editor}
          position={menuState.position}
          onClose={() => setMenuState({ isOpen: false, position: { x: 0, y: 0 } })}
        />
      )}
    </div>
  );
};

export default CodeBlockButton;

