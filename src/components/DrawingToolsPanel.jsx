import { useState, useEffect } from 'react';
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
  Paintbrush,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { useDrawing } from '../contexts/DrawingContext';
import { FRAME_PRESET_CATEGORIES } from '../constants/framePresets';
import { Undo2, Redo2, Download } from 'lucide-react';
import { exportCanvasAsPNG, exportCanvasAsSVG } from '../utils/exportCanvas';
import { useToastContext } from '../contexts/ToastContext';
import { useDraggablePanel } from '../hooks/useDraggablePanel';

const DrawingToolsPanel = ({ theme = 'dark' }) => {
  const toast = useToastContext();
  const drag = useDraggablePanel({
    storageKey: 'pureref-drawing-tools-panel',
    side: 'right',
    fabOffsetPx: 56,
    verticalBiasPx: -80,
  });
  const {
    selectedTool,
    setSelectedTool,
    undo,
    redo,
    canUndo,
    canRedo,
    elements,
    drawingMode,
    exitDrawingMode,
    selectedFramePreset,
    setSelectedFramePreset,
    framePlacementMode,
    setFramePlacementMode,
  } = useDrawing();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isLightTheme = theme === 'light';

  // Fechar ao clicar fora
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event) => {
      if (drag.panelRef.current && !drag.panelRef.current.contains(event.target)) {
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
          fixed right-4 z-[54] pointer-events-auto
          w-12 h-12 rounded-full
          flex items-center justify-center
          transition-all duration-300
          ring-1 shadow-xl
          ${isLightTheme ? 'ring-black/10' : 'ring-white/15'}
          ${isExpanded 
            ? 'top-[calc(50%-80px)]' 
            : 'top-[calc(50%+60px)]'
          }
          -translate-y-1/2
          ${isHovered || isExpanded
            ? 'opacity-100 bg-neutral-800/90 backdrop-blur-md'
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

      {isExpanded && drag.edgeCollapsed && (
        <button
          type="button"
          onClick={drag.expandFromEdge}
          title="Mostrar ferramentas"
          className={`
            ${drag.collapseStripClassName}
            ${isLightTheme
              ? 'bg-white/95 text-neutral-600 border-neutral-200 hover:bg-neutral-50'
              : 'bg-neutral-900/95 text-neutral-200 border-white/10 hover:bg-neutral-800'
            }
          `}
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
      )}

      {/* Container Expansível */}
      {isExpanded && !drag.edgeCollapsed && (
        <div
          ref={drag.panelRef}
          className={`
            relative w-80 rounded-lg shadow-2xl transition-all duration-300
            ${isLightTheme
              ? 'bg-white/95 backdrop-blur-md border border-neutral-200'
              : 'bg-neutral-900/95 backdrop-blur-md border border-white/10'
            }
          `}
          style={{
            ...drag.panelStyle,
            ...(!drag.hasCustomPosition ? { marginRight: 56 } : {}),
            overflowY: 'auto',
          }}
        >
          <button
            type="button"
            onClick={drag.toggleEdgeCollapsed}
            title="Recolher para a lateral"
            className={`
              absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full
              w-6 py-6 rounded-l-md border shadow-xl flex items-center justify-center
              transition-colors z-20 pointer-events-auto
              ${isLightTheme
                ? 'bg-white/95 border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                : 'bg-neutral-900/95 border-white/10 text-neutral-400 hover:bg-neutral-800'
              }
            `}
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            <ChevronRight size={16} strokeWidth={2} />
          </button>

          {/* Header */}
          <div
            onMouseDown={drag.handleHeaderMouseDown}
            className={`
              flex items-center justify-between px-4 py-3 border-b cursor-grab active:cursor-grabbing
              ${isLightTheme ? 'border-neutral-200' : 'border-white/10'}
            `}
          >
            <h3 className={`
              text-sm font-semibold select-none
              ${isLightTheme ? 'text-neutral-700' : 'text-white'}
            `}>
              Ferramentas de Desenho
            </h3>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className={`
                w-6 h-6 flex items-center justify-center rounded
                transition-colors cursor-pointer
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
                      if (tool.id !== 'frame') {
                        setIsExpanded(false);
                      }
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

            {selectedTool === 'frame' && (
              <div
                className={`space-y-3 pt-2 border-t ${isLightTheme ? 'border-neutral-200' : 'border-white/10'}`}
              >
                <p className={`text-xs font-medium ${isLightTheme ? 'text-neutral-600' : 'text-neutral-300'}`}>
                  Quadro (artboard)
                </p>
                <div className="flex rounded-lg overflow-hidden border border-neutral-500/30">
                  <button
                    type="button"
                    onClick={() => setFramePlacementMode('preset')}
                    className={`flex-1 py-1.5 text-xs font-medium ${
                      framePlacementMode === 'preset'
                        ? isLightTheme
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-blue-500/30 text-blue-200'
                        : isLightTheme
                          ? 'bg-neutral-100 text-neutral-600'
                          : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setFramePlacementMode('free')}
                    className={`flex-1 py-1.5 text-xs font-medium ${
                      framePlacementMode === 'free'
                        ? isLightTheme
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-blue-500/30 text-blue-200'
                        : isLightTheme
                          ? 'bg-neutral-100 text-neutral-600'
                          : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    Tamanho livre
                  </button>
                </div>
                {framePlacementMode === 'preset' && (
                  <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                    {FRAME_PRESET_CATEGORIES.map((cat) => (
                      <div key={cat.id}>
                        <div
                          className={`text-[10px] uppercase tracking-wide mb-1.5 ${
                            isLightTheme ? 'text-neutral-500' : 'text-neutral-500'
                          }`}
                        >
                          {cat.label}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.presets.map((p) => {
                            const active = selectedFramePreset?.id === p.id;
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedFramePreset(p)}
                                title={`${p.width} × ${p.height}`}
                                className={`px-2 py-1 rounded text-[11px] leading-tight text-left max-w-[140px] ${
                                  active
                                    ? isLightTheme
                                      ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-400'
                                      : 'bg-blue-500/25 text-blue-200 ring-1 ring-blue-400/50'
                                    : isLightTheme
                                      ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                                }`}
                              >
                                <span className="block font-medium truncate">{p.label}</span>
                                <span className="opacity-70">
                                  {p.width}×{p.height}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {framePlacementMode === 'preset' && (
                  <p className={`text-[11px] leading-snug ${isLightTheme ? 'text-neutral-500' : 'text-neutral-500'}`}>
                    Clique no canvas para colocar o quadro no tamanho do preset.
                  </p>
                )}
                {framePlacementMode === 'free' && (
                  <p className={`text-[11px] leading-snug ${isLightTheme ? 'text-neutral-500' : 'text-neutral-500'}`}>
                    Arraste no canvas para definir largura e altura.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DrawingToolsPanel;

