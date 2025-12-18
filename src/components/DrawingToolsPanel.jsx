import { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Hand, 
  Square, 
  Diamond, 
  Circle, 
  ArrowRight, 
  Minus, 
  Pencil, 
  Eraser,
  Frame,
  Paintbrush
} from 'lucide-react';

import { useDrawing } from '../contexts/DrawingContext';
import { Undo2, Redo2, Download } from 'lucide-react';
import { exportCanvasAsPNG, exportCanvasAsSVG } from '../utils/exportCanvas';
import { useToastContext } from '../contexts/ToastContext';

const DrawingToolsPanel = ({ theme = 'dark' }) => {
  const toast = useToastContext();
  const { selectedTool, setSelectedTool, undo, redo, canUndo, canRedo, elements, drawingMode, exitDrawingMode } = useDrawing();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const panelRef = useRef(null);

  const isLightTheme = theme === 'light';

  // Fechar ao clicar fora
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const tools = [
    { id: 'hand', icon: Hand, name: 'Mão', description: 'Selecionar/Mover' },
    { id: 'rectangle', icon: Square, name: 'Retângulo', description: 'Desenhar retângulo' },
    { id: 'diamond', icon: Diamond, name: 'Losango', description: 'Desenhar losango' },
    { id: 'circle', icon: Circle, name: 'Círculo', description: 'Desenhar círculo' },
    { id: 'arrow', icon: ArrowRight, name: 'Flecha', description: 'Desenhar flecha' },
    { id: 'line', icon: Minus, name: 'Linha', description: 'Desenhar linha' },
    { id: 'pencil', icon: Pencil, name: 'Lápis', description: 'Desenho livre' },
    { id: 'eraser', icon: Eraser, name: 'Borracha', description: 'Apagar' },
    { id: 'frame', icon: Frame, name: 'Quadro', description: 'Ferramenta de quadro' },
  ];

  return (
    <>
      {/* Botão Circular para Ferramentas de Desenho */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          fixed right-4 z-50
          w-12 h-12 rounded-full
          flex items-center justify-center
          transition-all duration-300
          ${isExpanded 
            ? 'top-[calc(50%-80px)]' 
            : 'top-[calc(50%+60px)]'
          }
          -translate-y-1/2
          ${isHovered || isExpanded
            ? 'opacity-100 bg-neutral-800/90 backdrop-blur-md shadow-lg'
            : 'opacity-50 bg-neutral-900/60 backdrop-blur-sm'
          }
          ${isLightTheme
            ? isHovered || isExpanded
              ? 'bg-white/90 text-neutral-700'
              : 'bg-white/60 text-neutral-500'
            : isHovered || isExpanded
              ? 'text-white border border-white/20'
              : 'text-neutral-400 border border-white/10'
          }
        `}
        style={{ WebkitAppRegion: 'no-drag' }}
        title="Ferramentas de Desenho"
      >
        <Paintbrush 
          size={20} 
          strokeWidth={2}
          className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Container Expansível */}
      {isExpanded && (
        <div
          ref={panelRef}
          className={`
            fixed right-4 top-[calc(50%-80px)] -translate-y-1/2 z-40
            w-80 rounded-lg shadow-2xl
            transition-all duration-300
            ${isLightTheme
              ? 'bg-white/95 backdrop-blur-md border border-neutral-200'
              : 'bg-neutral-900/95 backdrop-blur-md border border-white/10'
            }
          `}
          style={{ 
            WebkitAppRegion: 'no-drag',
            marginRight: '56px', // Espaço para o botão
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
        >
          {/* Header */}
          <div className={`
            flex items-center justify-between px-4 py-3 border-b
            ${isLightTheme ? 'border-neutral-200' : 'border-white/10'}
          `}>
            <h3 className={`
              text-sm font-semibold
              ${isLightTheme ? 'text-neutral-700' : 'text-white'}
            `}>
              Ferramentas de Desenho
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className={`
                w-6 h-6 flex items-center justify-center rounded
                transition-colors
                ${isLightTheme
                  ? 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'
                  : 'text-neutral-400 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <X size={14} />
            </button>
          </div>

          {/* Conteúdo - Grid de Ferramentas */}
          <div className="p-4 space-y-4">
            {/* Controles de Histórico e Exportação */}
            <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: isLightTheme ? '#e5e5e5' : 'rgba(255,255,255,0.1)' }}>
              <button
                onClick={undo}
                disabled={!canUndo}
                className={`
                  flex-1 px-3 py-2 rounded text-sm flex items-center justify-center gap-1
                  transition-colors
                  ${!canUndo
                    ? 'opacity-30 cursor-not-allowed'
                    : isLightTheme
                      ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }
                `}
                title="Desfazer (Ctrl+Z)"
              >
                <Undo2 size={14} />
                <span>Desfazer</span>
              </button>
                  <button
                    onClick={() => {
                      redo();
                      if (canRedo) toast.info('Refeito');
                    }}
                    disabled={!canRedo}
                className={`
                  flex-1 px-3 py-2 rounded text-sm flex items-center justify-center gap-1
                  transition-colors
                  ${!canRedo
                    ? 'opacity-30 cursor-not-allowed'
                    : isLightTheme
                      ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }
                `}
                title="Refazer (Ctrl+Shift+Z)"
              >
                <Redo2 size={14} />
                <span>Refazer</span>
              </button>
              <button
                onClick={async () => {
                  const canvas = document.querySelector('[data-drawing-canvas]');
                  if (canvas && canvas.parentElement) {
                    await exportCanvasAsPNG(canvas.parentElement, 'drawing.png');
                  }
                }}
                className={`
                  px-3 py-2 rounded text-sm flex items-center justify-center gap-1
                  transition-colors
                  ${elements.length === 0
                    ? 'opacity-30 cursor-not-allowed'
                    : isLightTheme
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                  }
                `}
                title="Exportar como PNG"
                disabled={elements.length === 0}
              >
                <Download size={14} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isSelected = selectedTool === tool.id;
                
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setSelectedTool(tool.id);
                      setIsExpanded(false); // Fechar painel após selecionar ferramenta
                    }}
                    className={`
                      aspect-square flex flex-col items-center justify-center gap-1 rounded
                      transition-colors
                      ${isSelected
                        ? isLightTheme
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/30'
                        : isLightTheme
                          ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }
                    `}
                    title={tool.description}
                  >
                    <Icon size={20} strokeWidth={2} />
                    <span className="text-xs">{tool.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DrawingToolsPanel;

