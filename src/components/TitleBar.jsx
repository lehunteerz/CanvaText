import { memo, useState, useEffect, useCallback } from 'react';
import { X, Minus, Pin, LayoutGrid, PanelTop, Keyboard, FileEdit } from 'lucide-react';

const TitleBar = memo(function TitleBar({ viewMode = 'canvas', setViewMode, onShowShortcuts }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Carregar estado inicial do alwaysOnTop de forma robusta
  useEffect(() => {
    const loadInitialState = async () => {
      if (window.electronAPI) {
        try {
          const isPinnedValue = await window.electronAPI.getAlwaysOnTop();
          setIsPinned(isPinnedValue);
        } catch (error) {
          console.error('Erro ao carregar estado inicial do alwaysOnTop:', error);
          // Em caso de erro, manter estado padrão (false)
          setIsPinned(false);
        }
      }
    };
    loadInitialState();
  }, []);

  const handleMinimize = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.minimize();
    }
  }, []);

  const handleClose = useCallback(() => {
    if (window.electronAPI) {
      window.electronAPI.close();
    }
  }, []);

  const handleTogglePin = useCallback(async () => {
    if (window.electronAPI) {
      try {
        // Sempre usar o retorno da chamada para atualizar o estado
        const newState = await window.electronAPI.toggleAlwaysOnTop();
        setIsPinned(newState);
        
        // Log para debug
        console.log('AlwaysOnTop alterado para:', newState);
      } catch (error) {
        console.error('Erro ao alternar alwaysOnTop:', error);
        // Em caso de erro, tentar obter o estado atual
        try {
          const currentState = await window.electronAPI.getAlwaysOnTop();
          setIsPinned(currentState);
        } catch (getError) {
          console.error('Erro ao obter estado atual do alwaysOnTop:', getError);
        }
      }
    }
  }, []);

  const handleSetCanvasMode = useCallback(() => {
    setViewMode('canvas');
  }, [setViewMode]);

  const handleSetTabsMode = useCallback(() => {
    setViewMode('tabs');
  }, [setViewMode]);

  const handleSetEditorMode = useCallback(() => {
    setViewMode('editor');
  }, [setViewMode]);

  return (
    <div 
      className="h-10 w-full bg-neutral-900/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0 select-none fixed top-0 left-0 right-0 z-50 transition-opacity duration-300"
      style={{ 
        WebkitAppRegion: 'drag',
        opacity: isHovered ? 1 : 0.4
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Esquerda: Ícone e Título */}
      <div className="flex items-center gap-2.5">
        <img 
          src="/icon.ico" 
          alt="CanvaText" 
          className="w-5 h-5 object-contain"
          style={{ WebkitAppRegion: 'no-drag' }}
        />
        <span className="text-gray-300 text-sm font-semibold">CanvaText</span>
      </div>

      {/* Centro: Botões de Modo de Visualização */}
      <div 
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {/* Botão Modo Canvas */}
        <button
          onClick={handleSetCanvasMode}
          className={`
            w-9 h-9 flex items-center justify-center rounded-md transition-all duration-200
            ${viewMode === 'canvas'
              ? 'text-blue-400 hover:bg-blue-500/20 bg-blue-500/10 shadow-sm' 
              : 'text-neutral-400 hover:bg-white/10 hover:text-white'
            }
          `}
          style={{ WebkitAppRegion: 'no-drag' }}
          title="Modo Canvas (Notas flutuantes)"
        >
          <LayoutGrid size={16} />
        </button>

        {/* Botão Modo Tabs */}
        <button
          onClick={handleSetTabsMode}
          className={`
            w-9 h-9 flex items-center justify-center rounded-md transition-all duration-200
            ${viewMode === 'tabs'
              ? 'text-blue-400 hover:bg-blue-500/20 bg-blue-500/10 shadow-sm' 
              : 'text-neutral-400 hover:bg-white/10 hover:text-white'
            }
          `}
          style={{ WebkitAppRegion: 'no-drag' }}
          title="Modo Abas (Organizado)"
        >
          <PanelTop size={16} />
        </button>

        {/* Botão Modo Editor */}
        <button
          onClick={handleSetEditorMode}
          className={`
            w-9 h-9 flex items-center justify-center rounded-md transition-all duration-200
            ${viewMode === 'editor'
              ? 'text-blue-400 hover:bg-blue-500/20 bg-blue-500/10 shadow-sm' 
              : 'text-neutral-400 hover:bg-white/10 hover:text-white'
            }
          `}
          style={{ WebkitAppRegion: 'no-drag' }}
          title="Modo Editor (Editor completo)"
        >
          <FileEdit size={16} />
        </button>
      </div>

      {/* Direita: Botões de Controle e Utilitários */}
      <div 
        className="flex items-center gap-1" 
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {/* Botão Atalhos de Teclado - Movido para próximo do Pin */}
        {onShowShortcuts && (
          <button
            onClick={onShowShortcuts}
            className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:bg-white/10 hover:text-white transition-all duration-200 rounded-md"
            style={{ WebkitAppRegion: 'no-drag' }}
            title="Atalhos de Teclado (Ctrl+Space)"
          >
            <Keyboard size={16} />
          </button>
        )}

        {/* Separador visual */}
        <div className="w-px h-5 bg-white/10 mx-1"></div>

        {/* Botão Fixar no Topo */}
        <button
          onClick={handleTogglePin}
          className={`
            w-9 h-9 flex items-center justify-center rounded-md transition-all duration-200
            ${isPinned 
              ? 'text-blue-400 hover:bg-blue-500/20 bg-blue-500/10 shadow-sm' 
              : 'text-neutral-400 hover:bg-white/10 hover:text-white'
            }
          `}
          style={{ WebkitAppRegion: 'no-drag' }}
          title={isPinned ? 'Desafixar janela' : 'Fixar no topo'}
        >
          <Pin size={16} className={isPinned ? 'fill-current' : ''} />
        </button>

        {/* Botão Minimizar */}
        <button
          onClick={handleMinimize}
          className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:bg-white/10 hover:text-white transition-all duration-200 rounded-md"
          style={{ WebkitAppRegion: 'no-drag' }}
          title="Minimizar"
        >
          <Minus size={16} />
        </button>

        {/* Botão Fechar */}
        <button
          onClick={handleClose}
          className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 rounded-md"
          style={{ WebkitAppRegion: 'no-drag' }}
          title="Fechar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
});

export default TitleBar;
