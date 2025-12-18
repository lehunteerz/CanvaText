import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy } from 'lucide-react';

const ColorPicker = ({ initialColor = '#000000', onColorChange, onClose, theme = 'dark' }) => {
  const [color, setColor] = useState(initialColor);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [opacity, setOpacity] = useState(100);
  const [hexValue, setHexValue] = useState(initialColor);
  const pickerRef = useRef(null);
  const isLightTheme = theme === 'light';

  // Converter HSL para HEX
  const hslToHex = (h, s, l) => {
    h = h % 360;
    s = s / 100;
    l = l / 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Converter HEX para HSL
  const hexToHsl = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
        default: h = 0;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  // Inicializar valores HSL do initialColor
  useEffect(() => {
    if (initialColor && initialColor !== 'transparent') {
      const hsl = hexToHsl(initialColor);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
      setHexValue(initialColor);
    }
  }, [initialColor]);

  // Atualizar cor quando HSL mudar
  useEffect(() => {
    const hex = hslToHex(hue, saturation, lightness);
    setColor(hex);
    setHexValue(hex);
    onColorChange?.(hex);
  }, [hue, saturation, lightness]);

  // Atualizar HSL quando HEX mudar
  const handleHexChange = (hex) => {
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      setHexValue(hex);
      const hsl = hexToHsl(hex);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
      setColor(hex);
      onColorChange?.(hex);
    } else {
      setHexValue(hex);
    }
  };

  // Copiar HEX para clipboard
  const handleCopyHex = async () => {
    try {
      await navigator.clipboard.writeText(hexValue);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose?.(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleEscape, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [onClose]);

  // Calcular posição do seletor no gradiente
  const getGradientPosition = (e, element) => {
    const rect = element.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  // Manipular clique no gradiente
  const handleGradientClick = (e) => {
    const { x, y } = getGradientPosition(e, e.currentTarget);
    setSaturation(x);
    setLightness(100 - y);
  };

  const pickerContent = (
    <div
      ref={pickerRef}
      className={`
        fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[999999]
        w-80 rounded-lg shadow-2xl
        ${isLightTheme
          ? 'bg-white border border-neutral-200'
          : 'bg-neutral-900 border border-white/10'
        }
      `}
      style={{ WebkitAppRegion: 'no-drag' }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
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
          Selecionar cor de fundo
        </h3>
        <button
          onClick={() => onClose?.(null)}
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
        {/* Gradiente de cores */}
        <div
          className="w-full h-48 rounded cursor-crosshair relative"
          style={{
            background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, hsl(${hue}, 100%, 50%))`,
          }}
          onClick={handleGradientClick}
          onMouseMove={(e) => {
            if (e.buttons === 1) {
              handleGradientClick(e);
            }
          }}
        >
          {/* Indicador de posição */}
          <div
            className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg pointer-events-none"
            style={{
              left: `${saturation}%`,
              top: `${100 - lightness}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        {/* Slider de matiz */}
        <div>
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
            className="w-full"
            style={{
              accentColor: `hsl(${hue}, 100%, 50%)`,
            }}
          />
          <div className="w-full h-4 rounded mt-1" style={{
            background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
          }} />
        </div>

        {/* Slider de opacidade */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={`
              text-xs
              ${isLightTheme ? 'text-neutral-600' : 'text-neutral-300'}
            `}>
              Opacidade
            </span>
            <span className={`
              text-xs
              ${isLightTheme ? 'text-neutral-500' : 'text-neutral-400'}
            `}>
              {opacity}%
            </span>
          </div>
          <div className="relative">
            <div className="w-full h-4 rounded" style={{
              backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 8px 8px',
            }}>
              <div
                className="h-full rounded"
                style={{
                  width: `${opacity}%`,
                  background: `linear-gradient(to right, ${color}00, ${color}ff)`,
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Input HEX */}
        <div>
          <label className={`
            block text-xs font-medium mb-1
            ${isLightTheme ? 'text-neutral-600' : 'text-neutral-300'}
          `}>
            HEX
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={hexValue}
              onChange={(e) => handleHexChange(e.target.value.toUpperCase())}
              className={`
                flex-1 px-3 py-2 rounded text-sm font-mono
                ${isLightTheme
                  ? 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                  : 'bg-neutral-800 text-neutral-300 border border-white/10'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500
              `}
              placeholder="#000000"
              maxLength={7}
            />
            <button
              onClick={handleCopyHex}
              className={`
                px-3 py-2 rounded
                transition-colors
                ${isLightTheme
                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }
              `}
              title="Copiar HEX"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2 pt-2 border-t" style={{
          borderColor: isLightTheme ? '#e5e5e5' : 'rgba(255,255,255,0.1)',
        }}>
          <button
            onClick={() => onClose?.(null)}
            className={`
              flex-1 px-4 py-2 rounded text-sm
              transition-colors
              ${isLightTheme
                ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }
            `}
          >
            Cancelar
          </button>
          <button
            onClick={() => onClose?.(color)}
            className={`
              flex-1 px-4 py-2 rounded text-sm font-medium
              transition-colors
              ${isLightTheme
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }
            `}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(pickerContent, document.body);
};

export default ColorPicker;

