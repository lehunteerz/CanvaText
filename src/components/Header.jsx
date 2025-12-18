import { X, Minus, Maximize2, Pin, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { autoSaveManager } from '../utils/autoSaveManager';

function Header() {
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Verificar estado inicial do alwaysOnTop
    if (window.electronAPI) {
      window.electronAPI.getAlwaysOnTop().then(setIsPinned);
    }
    
    // Escutar mudanças no estado de salvamento
    const cleanup = autoSaveManager.onSavingStateChange((saving) => {
      setIsSaving(saving);
    });
    
    return cleanup;
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  const handleTogglePin = () => {
    if (window.electronAPI) {
      window.electronAPI.toggleAlwaysOnTop().then(setIsPinned);
    }
  };

  return (
    <div 
      className="h-10 bg-neutral-900/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* Título ou espaço vazio */}
      <div className="flex-1 flex items-center gap-2">
        {/* Indicador de salvamento */}
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-gray-400 px-3 py-1 rounded bg-white/5">
            <Loader2 size={14} className="animate-spin" />
            <span>Saving...</span>
          </div>
        )}
      </div>

      {/* Botões de controle */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
        {/* Botão Fixar no Topo */}
        <button
          onClick={handleTogglePin}
          className={`
            w-8 h-8 flex items-center justify-center rounded
            transition-all duration-200
            ${isPinned 
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
              : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }
          `}
          title={isPinned ? 'Desafixar janela' : 'Fixar no topo'}
        >
          <Pin size={16} className={isPinned ? 'fill-current' : ''} />
        </button>

        {/* Botão Minimizar */}
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200"
          title="Minimizar"
        >
          <Minus size={16} />
        </button>

        {/* Botão Maximizar */}
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200"
          title="Maximizar"
        >
          <Maximize2 size={16} />
        </button>

        {/* Botão Fechar */}
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
          title="Fechar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default Header;

