import { useState, useEffect, useRef } from 'react';
import { Copy, Trash2, Link2, X } from 'lucide-react';

const SelectionPopup = ({ theme = 'dark', selectedItem, onClose, onClone, onDelete, onLink }) => {
  const [opacity, setOpacity] = useState(100);
  const [layer, setLayer] = useState('Meio');
  const popupRef = useRef(null);

  const isLightTheme = theme === 'light';

  // Sincronizar estado com elemento selecionado
  useEffect(() => {
    if (selectedItem) {
      setOpacity(selectedItem.style?.opacity ?? 100);
      setLayer(selectedItem.layer ?? 'Meio');
    } else {
      setOpacity(100);
      setLayer('Meio');
    }
  }, [selectedItem]);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!selectedItem) return;

    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    // Pequeno delay para evitar fechar imediatamente ao abrir
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [selectedItem, onClose]);

  if (!selectedItem) return null;

  return (
    <div
      ref={popupRef}
      className={`
        fixed right-4 top-1/2 -translate-y-1/2 z-50
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
              {opacity}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="w-full"
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
          <div className="space-y-1">
            {['Frente', 'Meio', 'Atrás'].map((layerOption) => (
              <button
                key={layerOption}
                onClick={() => setLayer(layerOption)}
                className={`
                  w-full px-3 py-2 rounded text-sm text-left
                  transition-colors
                  ${layer === layerOption
                    ? isLightTheme
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : isLightTheme
                      ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }
                `}
              >
                {layerOption}
              </button>
            ))}
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
            {/* Clonar */}
            <button
              onClick={onClone}
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
              <span>Clonar</span>
            </button>

            {/* Link */}
            <button
              onClick={onLink}
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
              onClick={onDelete}
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
};

export default SelectionPopup;

