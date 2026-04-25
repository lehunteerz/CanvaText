import { memo, useState, useEffect, useCallback } from 'react';
import { X, Minus, Pin, LayoutGrid, PanelTop, Keyboard, FileEdit, Sun, Moon } from 'lucide-react';
import ExportMenu from './ExportMenu';
import { useTheme } from '../contexts/ThemeContext';

const TitleBar = memo(function TitleBar({
  viewMode = 'canvas',
  setViewMode,
  onShowShortcuts,
  titleBarEditor = null,
  titleBarExportNoteTitle = 'Editor',
}) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
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

  const modeBtnIdle = isLight
    ? 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
    : 'text-neutral-300 hover:bg-white/10 hover:text-white';
  const modeBtnActive = isLight
    ? 'text-blue-600 hover:bg-blue-500/15 bg-blue-500/10 shadow-sm'
    : 'text-blue-400 hover:bg-blue-500/20 bg-blue-500/10 shadow-sm';
  const utilBtn = isLight
    ? 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
    : 'text-neutral-300 hover:bg-white/10 hover:text-white';

  return (
    <div 
      className={`h-10 w-full backdrop-blur-md flex items-center justify-between px-4 flex-shrink-0 select-none fixed top-0 left-0 right-0 z-50 transition-opacity duration-300 border-b ${
        isLight
          ? 'bg-white/95 border-neutral-200'
          : 'bg-neutral-900/95 border-white/10'
      }`}
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
        <span className={`text-sm font-semibold ${isLight ? 'text-neutral-900' : 'text-neutral-100'}`}>
          CanvaText
        </span>
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
            ${viewMode === 'canvas' ? modeBtnActive : modeBtnIdle}
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
            ${viewMode === 'tabs' ? modeBtnActive : modeBtnIdle}
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
            ${viewMode === 'editor' ? modeBtnActive : modeBtnIdle}
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
        {/* Exportar / Salvar como — modo editor, ao lado dos atalhos */}
        {viewMode === 'editor' && titleBarEditor && (
          <ExportMenu
            editor={titleBarEditor}
            noteTitle={titleBarExportNoteTitle}
            variant="titleBar"
          />
        )}

        {/* Tema claro / escuro — visível em todos os modos */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-200 border-none outline-none ${utilBtn}`}
          style={{ WebkitAppRegion: 'no-drag' }}
          title={isLight ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
        >
          {isLight ? <Moon size={16} strokeWidth={2} /> : <Sun size={16} strokeWidth={2} />}
        </button>

        {/* Botão Atalhos de Teclado */}
        {onShowShortcuts && (
          <button
            onClick={onShowShortcuts}
            className={`w-9 h-9 flex items-center justify-center transition-all duration-200 rounded-md ${utilBtn}`}
            style={{ WebkitAppRegion: 'no-drag' }}
            title="Atalhos de Teclado (Ctrl+Space)"
          >
            <Keyboard size={16} />
          </button>
        )}

        {/* Separador visual */}
        <div className={`w-px h-5 mx-1 ${isLight ? 'bg-neutral-200' : 'bg-white/10'}`} />

        {/* Botão Fixar no Topo */}
        <button
          onClick={handleTogglePin}
          className={`
            w-9 h-9 flex items-center justify-center rounded-md transition-all duration-200
            ${isPinned
              ? isLight
                ? 'text-blue-600 hover:bg-blue-500/15 bg-blue-500/10 shadow-sm'
                : 'text-blue-400 hover:bg-blue-500/20 bg-blue-500/10 shadow-sm'
              : utilBtn
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
          className={`w-9 h-9 flex items-center justify-center transition-all duration-200 rounded-md ${utilBtn}`}
          style={{ WebkitAppRegion: 'no-drag' }}
          title="Minimizar"
        >
          <Minus size={16} />
        </button>

        {/* Botão Fechar */}
        <button
          onClick={handleClose}
          className={`w-9 h-9 flex items-center justify-center transition-all duration-200 rounded-md ${
            isLight
              ? 'text-neutral-600 hover:bg-red-500/15 hover:text-red-600'
              : 'text-neutral-300 hover:bg-red-500/20 hover:text-red-400'
          }`}
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
