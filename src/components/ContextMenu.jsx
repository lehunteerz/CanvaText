import { useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * Menu de contexto para correção ortográfica
 */
function ContextMenu({ position, suggestions, onSelect, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!position || !suggestions || suggestions.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed bg-neutral-900 border border-white/10 rounded-lg shadow-2xl z-[10000] min-w-[200px] py-1"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        WebkitAppRegion: 'no-drag',
      }}
    >
      <div className="px-2 py-1.5 text-xs text-neutral-400 border-b border-white/10">
        Sugestões:
      </div>
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => {
            onSelect(suggestion);
            onClose();
          }}
          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-blue-500/20 hover:text-blue-300 transition-colors flex items-center gap-2"
        >
          <CheckCircle2 size={14} className="text-blue-400" />
          <span>{suggestion}</span>
        </button>
      ))}
    </div>
  );
}

export default ContextMenu;

