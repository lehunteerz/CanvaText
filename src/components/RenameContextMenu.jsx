import { useEffect, useRef } from 'react';
import { FileEdit } from 'lucide-react';

/**
 * Menu de contexto para renomear arquivo
 */
function RenameContextMenu({ x, y, onRename, onClose }) {
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

  if (x === null || y === null) return null;

  return (
    <div
      ref={menuRef}
      className="fixed bg-neutral-900 border border-white/10 rounded-lg shadow-2xl z-[10000] min-w-[180px] py-1"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        WebkitAppRegion: 'no-drag',
      }}
    >
      <button
        onClick={() => {
          onRename();
          onClose();
        }}
        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-blue-500/20 hover:text-blue-300 transition-colors flex items-center gap-2"
      >
        <FileEdit size={14} className="text-blue-400" />
        <span>Renomear arquivo + formato</span>
      </button>
    </div>
  );
}

export default RenameContextMenu;

