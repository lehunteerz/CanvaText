import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronDown, 
  ChevronUp,
  Copy,
  Trash2,
  Link2,
  X
} from 'lucide-react';
import { useDrawing } from '../../contexts/DrawingContext';
import ColorPicker from './ColorPicker';

// Paleta de cores para fundo
const BACKGROUND_COLORS = [
  { name: 'Transparente', color: 'transparent', isTransparent: true },
  { name: 'Rosa claro', color: '#FEE2E2' },
  { name: 'Verde claro', color: '#D1FAE5' },
  { name: 'Azul claro', color: '#DBEAFE' },
  { name: 'Amarelo claro', color: '#FEF3C7' },
  { name: 'Roxo claro', color: '#E9D5FF' },
  { name: 'Rosa claro 2', color: '#FCE7F3' },
];

// Opções de espessura
const STROKE_WIDTHS = [
  { value: 1, label: 'Fino' },
  { value: 2, label: 'Médio' },
  { value: 3, label: 'Grosso' },
];

const ElementContextMenu = ({ element, position, onClose, theme = 'dark' }) => {
  const {
    updateElement,
    sendToBack,
    bringToFront,
    sendBackward,
    bringForward,
    cloneElement,
    deleteElement,
    addLink,
  } = useDrawing();

  const [showColorPicker, setShowColorPicker] = useState(false);
  const menuRef = useRef(null);
  const isLightTheme = theme === 'light';

  const currentStyle = element?.style || {};

  // Atualizar estilo do elemento
  const updateStyle = (styleUpdates) => {
    if (element) {
      updateElement(element.id, {
        style: { ...element.style, ...styleUpdates }
      });
    }
  };

  // Selecionar cor de fundo
  const handleBackgroundColorSelect = (color) => {
    updateStyle({ fill: color });
  };

  // Abrir color picker
  const handleOpenColorPicker = () => {
    setShowColorPicker(true);
  };

  // Fechar color picker e aplicar cor
  const handleColorPickerClose = (color) => {
    if (color) {
      handleBackgroundColorSelect(color);
    }
    setShowColorPicker(false);
  };

  // Selecionar espessura
  const handleStrokeWidthSelect = (width) => {
    updateStyle({ strokeWidth: width });
  };

  // Atualizar opacidade
  const handleOpacityChange = (opacity) => {
    updateStyle({ opacity: Math.round(opacity) });
  };

  // Ações de camadas
  const handleLayerAction = (action) => {
    if (!element) return;

    switch (action) {
      case 'sendToBack':
        sendToBack(element.id);
        break;
      case 'bringToFront':
        bringToFront(element.id);
        break;
      case 'sendBackward':
        sendBackward(element.id);
        break;
      case 'bringForward':
        bringForward(element.id);
        break;
    }
  };

  // Ações
  const handleDuplicate = () => {
    if (element) {
      cloneElement(element.id);
    }
    onClose?.();
  };

  const handleDelete = () => {
    if (element) {
      deleteElement(element.id);
    }
    onClose?.();
  };

  const handleLink = () => {
    if (element) {
      const url = prompt('Digite o link:', element.link || '');
      if (url !== null) {
        if (url.trim()) {
          addLink(element.id, url.trim());
        } else {
          addLink(element.id, null);
        }
      }
    }
    onClose?.();
  };

  // Fechar ao clicar fora
  useEffect(() => {
    if (!element) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        // Não fechar se clicar no color picker
        if (event.target.closest('[data-color-picker]')) {
          return;
        }
        onClose?.();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('keydown', handleEscape, true);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [element, onClose]);

  if (!element) return null;

  const menuContent = (
    <div
      ref={menuRef}
      className={`
        fixed z-[999999] rounded-lg shadow-2xl
        transition-all duration-300
        ${isLightTheme
          ? 'bg-white/95 backdrop-blur-md border border-neutral-200'
          : 'bg-neutral-900/95 backdrop-blur-md border border-white/10'
        }
      `}
      style={{
        WebkitAppRegion: 'no-drag',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '280px',
        maxHeight: '80vh',
        overflowY: 'auto',
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent?.stopImmediatePropagation) {
          e.nativeEvent.stopImmediatePropagation();
        }
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent?.stopImmediatePropagation) {
          e.nativeEvent.stopImmediatePropagation();
        }
      }}
      data-element-context-menu
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
          Propriedades
        </h3>
        <button
          onClick={onClose}
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

      {/* Conteúdo */}
      <div className="p-4 space-y-4">
        {/* Fundo */}
        <div>
          <label className={`
            block text-xs font-medium mb-2
            ${isLightTheme ? 'text-neutral-600' : 'text-neutral-300'}
          `}>
            Fundo
          </label>
          <div className="flex flex-wrap gap-2">
            {BACKGROUND_COLORS.map((colorOption) => (
              <button
                key={colorOption.color}
                onClick={() => handleBackgroundColorSelect(colorOption.color)}
                className={`
                  w-8 h-8 rounded border-2 transition-all
                  ${currentStyle.fill === colorOption.color
                    ? isLightTheme
                      ? 'border-blue-500 scale-110'
                      : 'border-blue-400 scale-110'
                    : isLightTheme
                      ? 'border-neutral-300 hover:border-neutral-400'
                      : 'border-white/20 hover:border-white/40'
                  }
                `}
                style={
                  colorOption.isTransparent
                    ? {
                        backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 8px 8px',
                        backgroundColor: '#f0f0f0',
                      }
                    : {
                        backgroundColor: colorOption.color,
                      }
                }
                title={colorOption.name}
              />
            ))}
            {/* Botão para abrir color picker */}
            <button
              onClick={handleOpenColorPicker}
              className={`
                w-8 h-8 rounded border-2 flex items-center justify-center
                transition-all
                ${isLightTheme
                  ? 'border-neutral-300 hover:border-neutral-400 bg-neutral-100'
                  : 'border-white/20 hover:border-white/40 bg-neutral-800'
                }
              `}
              title="Selecionar cor personalizada"
            >
              <div className="w-4 h-4 rounded" style={{
                background: 'linear-gradient(45deg, #ff0000, #ff00ff, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)',
              }} />
            </button>
          </div>
        </div>

        {/* Espessura do traço */}
        <div>
          <label className={`
            block text-xs font-medium mb-2
            ${isLightTheme ? 'text-neutral-600' : 'text-neutral-300'}
          `}>
            Espessura do traço
          </label>
          <div className="flex gap-2">
            {STROKE_WIDTHS.map((widthOption) => (
              <button
                key={widthOption.value}
                onClick={() => handleStrokeWidthSelect(widthOption.value)}
                className={`
                  flex-1 px-3 py-2 rounded text-sm flex items-center justify-center gap-2
                  transition-colors
                  ${currentStyle.strokeWidth === widthOption.value
                    ? isLightTheme
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/30'
                    : isLightTheme
                      ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-2 border-transparent'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-2 border-transparent'
                  }
                `}
                title={widthOption.label}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: '100%',
                    height: `${widthOption.value * 2}px`,
                    backgroundColor: currentStyle.stroke || '#000000',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Opacidade */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`
              text-xs font-medium
              ${isLightTheme ? 'text-neutral-600' : 'text-neutral-300'}
            `}>
              Opacidade
            </label>
            <span className={`
              text-xs
              ${isLightTheme ? 'text-neutral-500' : 'text-neutral-400'}
            `}>
              {currentStyle.opacity ?? 100}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={currentStyle.opacity ?? 100}
            onChange={(e) => handleOpacityChange(Number(e.target.value))}
            className="w-full"
            style={{
              accentColor: isLightTheme ? '#3B82F6' : '#60A5FA',
            }}
          />
        </div>

        {/* Camadas */}
        <div>
          <label className={`
            block text-xs font-medium mb-2
            ${isLightTheme ? 'text-neutral-600' : 'text-neutral-300'}
          `}>
            Camadas
          </label>
          <div className="grid grid-cols-4 gap-2">
            {/* Enviar para trás */}
            <button
              onClick={() => handleLayerAction('sendToBack')}
              className={`
                aspect-square flex items-center justify-center rounded
                transition-colors
                ${isLightTheme
                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }
              `}
              title="Enviar para o fundo"
            >
              <ChevronDown size={16} />
            </button>

            {/* Enviar para trás (um nível) */}
            <button
              onClick={() => handleLayerAction('sendBackward')}
              className={`
                aspect-square flex items-center justify-center rounded
                transition-colors
                ${isLightTheme
                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }
              `}
              title="Enviar para trás"
            >
              <ChevronDown size={16} className="opacity-50" />
            </button>

            {/* Trazer para frente (um nível) */}
            <button
              onClick={() => handleLayerAction('bringForward')}
              className={`
                aspect-square flex items-center justify-center rounded
                transition-colors
                ${isLightTheme
                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }
              `}
              title="Trazer para frente"
            >
              <ChevronUp size={16} className="opacity-50" />
            </button>

            {/* Trazer para frente */}
            <button
              onClick={() => handleLayerAction('bringToFront')}
              className={`
                aspect-square flex items-center justify-center rounded
                transition-colors
                ${isLightTheme
                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }
              `}
              title="Trazer para o primeiro plano"
            >
              <ChevronUp size={16} />
            </button>
          </div>
        </div>

        {/* Separador */}
        <div className={`
          border-t pt-4
          ${isLightTheme ? 'border-neutral-200' : 'border-white/10'}
        `}>
          <label className={`
            block text-xs font-medium mb-3
            ${isLightTheme ? 'text-neutral-600' : 'text-neutral-300'}
          `}>
            Ações
          </label>
          
          <div className="space-y-2">
            {/* Duplicar */}
            <button
              onClick={handleDuplicate}
              className={`
                w-full flex items-center gap-2 px-3 py-2 rounded text-sm
                transition-colors
                ${isLightTheme
                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }
              `}
            >
              <Copy size={16} />
              <span>Duplicar</span>
            </button>

            {/* Link */}
            <button
              onClick={handleLink}
              className={`
                w-full flex items-center gap-2 px-3 py-2 rounded text-sm
                transition-colors
                ${isLightTheme
                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }
              `}
            >
              <Link2 size={16} />
              <span>Link</span>
            </button>

            {/* Apagar */}
            <button
              onClick={handleDelete}
              className={`
                w-full flex items-center gap-2 px-3 py-2 rounded text-sm
                transition-colors
                ${isLightTheme
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                }
              `}
            >
              <Trash2 size={16} />
              <span>Apagar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(menuContent, document.body)}
      
      {/* Color Picker Modal */}
      {showColorPicker && (
        <ColorPicker
          initialColor={currentStyle.fill || 'transparent'}
          onColorChange={(color) => {
            handleBackgroundColorSelect(color);
          }}
          onClose={handleColorPickerClose}
          theme={theme}
        />
      )}
    </>
  );
};

export default ElementContextMenu;

