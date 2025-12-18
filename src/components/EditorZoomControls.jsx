import { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

const EditorZoomControls = ({ theme = 'dark' }) => {
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    // Aplicar zoom no wrapper do editor
    const editorWrapper = document.querySelector('.tiptap-wrapper');
    if (editorWrapper) {
      editorWrapper.style.transform = `scale(${zoomLevel / 100})`;
      editorWrapper.style.transformOrigin = 'top center';
    }
  }, [zoomLevel]);

  // Listener para Ctrl + Scroll do mouse
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -5 : 5; // Scroll para baixo diminui, para cima aumenta
        setZoomLevel(prev => {
          const newZoom = prev + delta;
          return Math.max(50, Math.min(200, newZoom)); // Limitar entre 50% e 200%
        });
      }
    };

    const editorArea = document.querySelector('.flex-1.overflow-y-auto');
    if (editorArea) {
      editorArea.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        editorArea.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200)); // Máximo 200%
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50)); // Mínimo 50%
  };

  const isLightTheme = theme === 'light';

  return (
    <div 
      className={`flex items-center gap-1 px-2 py-1 border-t backdrop-blur-md ${
        isLightTheme
          ? 'border-neutral-200 bg-white/80'
          : 'border-white/10 bg-neutral-900/50'
      }`}
      style={{ WebkitAppRegion: 'no-drag', width: '128px' }}
    >
      <button
        onClick={handleZoomOut}
        disabled={zoomLevel <= 50}
        className={`
          w-6 h-6 flex items-center justify-center rounded transition-colors duration-150
          border-none outline-none
          ${isLightTheme
            ? zoomLevel <= 50
              ? 'opacity-30 cursor-not-allowed text-neutral-400'
              : 'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            : zoomLevel <= 50
              ? 'opacity-30 cursor-not-allowed text-neutral-500'
              : 'bg-transparent text-neutral-400 hover:bg-white/10 hover:text-white'
          }
        `}
        title="Diminuir zoom (Ctrl+Scroll)"
      >
        <ZoomOut size={12} strokeWidth={2.5} />
      </button>

      <span className={`
        text-xs font-medium min-w-[2.5rem] text-center
        ${isLightTheme ? 'text-neutral-600' : 'text-neutral-400'}
      `}>
        {zoomLevel}%
      </span>

      <button
        onClick={handleZoomIn}
        disabled={zoomLevel >= 200}
        className={`
          w-6 h-6 flex items-center justify-center rounded transition-colors duration-150
          border-none outline-none
          ${isLightTheme
            ? zoomLevel >= 200
              ? 'opacity-30 cursor-not-allowed text-neutral-400'
              : 'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            : zoomLevel >= 200
              ? 'opacity-30 cursor-not-allowed text-neutral-500'
              : 'bg-transparent text-neutral-400 hover:bg-white/10 hover:text-white'
          }
        `}
        title="Aumentar zoom (Ctrl+Scroll)"
      >
        <ZoomIn size={12} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default EditorZoomControls;

