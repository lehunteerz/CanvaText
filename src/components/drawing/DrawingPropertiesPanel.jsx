import { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Upload,
  X
} from 'lucide-react';
import { useDrawing } from '../../contexts/DrawingContext';
import ColorPicker from './ColorPicker';

// Paleta de cores para contorno
const OUTLINE_COLORS = [
  { name: 'Preto', color: '#000000' },
  { name: 'Vermelho', color: '#EF4444' },
  { name: 'Verde', color: '#10B981' },
  { name: 'Azul', color: '#3B82F6' },
  { name: 'Laranja', color: '#F59E0B' },
  { name: 'Roxo', color: '#8B5CF6' },
  { name: 'Rosa', color: '#EC4899' },
];

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

const DrawingPropertiesPanel = ({ theme = 'dark' }) => {
  const {
    defaultStyle,
    setDefaultStyle,
    selectedElementId,
    elements,
    updateElement,
    sendToBack,
    bringToFront,
    sendBackward,
    bringForward,
  } = useDrawing();

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerType, setColorPickerType] = useState(null); // 'stroke' | 'fill'
  const panelRef = useRef(null);
  const isLightTheme = theme === 'light';

  // Obter elemento selecionado
  const selectedElement = selectedElementId 
    ? elements.find(el => el.id === selectedElementId)
    : null;

  // Usar estilo do elemento selecionado ou estilo padrão
  const currentStyle = selectedElement?.style || defaultStyle;

  // Atualizar estilo (do elemento selecionado ou padrão)
  const updateStyle = (styleUpdates) => {
    if (selectedElementId && selectedElement) {
      // Atualizar elemento selecionado
      updateElement(selectedElementId, {
        style: { ...selectedElement.style, ...styleUpdates }
      });
    } else {
      // Atualizar estilo padrão
      setDefaultStyle({ ...defaultStyle, ...styleUpdates });
    }
  };

  // Selecionar cor de contorno
  const handleOutlineColorSelect = (color) => {
    updateStyle({ stroke: color });
  };

  // Selecionar cor de fundo
  const handleBackgroundColorSelect = (color) => {
    updateStyle({ fill: color });
  };

  // Abrir color picker
  const handleOpenColorPicker = (type) => {
    setColorPickerType(type);
    setShowColorPicker(true);
  };

  // Fechar color picker e aplicar cor
  const handleColorPickerClose = (color) => {
    if (color && colorPickerType) {
      if (colorPickerType === 'stroke') {
        handleOutlineColorSelect(color);
      } else if (colorPickerType === 'fill') {
        handleBackgroundColorSelect(color);
      }
    }
    setShowColorPicker(false);
    setColorPickerType(null);
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
    if (!selectedElementId) return;

    switch (action) {
      case 'sendToBack':
        sendToBack(selectedElementId);
        break;
      case 'bringToFront':
        bringToFront(selectedElementId);
        break;
      case 'sendBackward':
        sendBackward(selectedElementId);
        break;
      case 'bringForward':
        bringForward(selectedElementId);
        break;
    }
  };

  // Renderizar cor transparente (padrão)
  const renderTransparentColor = () => (
    <div
      className="w-8 h-8 rounded border-2 border-white/20"
      style={{
        backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 8px 8px',
        backgroundColor: '#f0f0f0',
      }}
    />
  );

  return (
    <>
      <div
        ref={panelRef}
        className={`
          fixed left-4 top-1/2 -translate-y-1/2 z-40
          w-72 rounded-lg shadow-2xl
          transition-all duration-300
          ${isLightTheme
            ? 'bg-white/95 backdrop-blur-md border border-neutral-200'
            : 'bg-neutral-900/95 backdrop-blur-md border border-white/10'
          }
        `}
        style={{ 
          WebkitAppRegion: 'no-drag',
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
            {selectedElement ? 'Propriedades' : 'Configurações'}
          </h3>
        </div>

        {/* Conteúdo */}
        <div className="p-4 space-y-5">
          {/* Contorno */}
          <div>
            <label className={`
              block text-xs font-medium mb-2
              ${isLightTheme ? 'text-neutral-600' : 'text-neutral-300'}
            `}>
              Contorno
            </label>
            <div className="flex flex-wrap gap-2">
              {OUTLINE_COLORS.map((colorOption) => (
                <button
                  key={colorOption.color}
                  onClick={() => handleOutlineColorSelect(colorOption.color)}
                  className={`
                    w-8 h-8 rounded border-2 transition-all
                    ${currentStyle.stroke === colorOption.color
                      ? isLightTheme
                        ? 'border-blue-500 scale-110'
                        : 'border-blue-400 scale-110'
                      : isLightTheme
                        ? 'border-neutral-300 hover:border-neutral-400'
                        : 'border-white/20 hover:border-white/40'
                    }
                  `}
                  style={{
                    backgroundColor: colorOption.color,
                  }}
                  title={colorOption.name}
                />
              ))}
            </div>
          </div>

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
                onClick={() => handleOpenColorPicker('fill')}
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

          {/* Camadas (apenas se houver elemento selecionado) */}
          {selectedElement && (
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
          )}
        </div>
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <ColorPicker
          initialColor={colorPickerType === 'stroke' ? currentStyle.stroke : currentStyle.fill}
          onColorChange={(color) => {
            if (colorPickerType === 'stroke') {
              handleOutlineColorSelect(color);
            } else if (colorPickerType === 'fill') {
              handleBackgroundColorSelect(color);
            }
          }}
          onClose={handleColorPickerClose}
          theme={theme}
        />
      )}
    </>
  );
};

export default DrawingPropertiesPanel;

