import { useState, useRef, useEffect } from 'react';
import { Settings, X } from 'lucide-react';

const EditorSidePanel = ({ theme = 'dark' }) => {
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

  return (
    <>
      {/* Botão Circular no Lado Direito */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          fixed right-4 top-1/2 -translate-y-1/2 z-50
          w-12 h-12 rounded-full
          flex items-center justify-center
          transition-all duration-300
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
        title="Painel de configurações"
      >
        <Settings 
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
            fixed right-4 top-1/2 -translate-y-1/2 z-40
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
              Configurações
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

          {/* Conteúdo */}
          <div className="p-4 space-y-4">
            {/* Contorno */}
            <div>
              <label className={`
                block text-xs font-medium mb-2
                ${isLightTheme ? 'text-neutral-600' : 'text-neutral-300'}
              `}>
                Contorno
              </label>
              <div className="flex gap-2">
                <button className={`
                  flex-1 px-3 py-2 rounded text-sm
                  transition-colors
                  ${isLightTheme
                    ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }
                `}>
                  Sólido
                </button>
                <button className={`
                  flex-1 px-3 py-2 rounded text-sm
                  transition-colors
                  ${isLightTheme
                    ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }
                `}>
                  Tracejado
                </button>
              </div>
            </div>

            {/* Família da Fonte */}
            <div>
              <label className={`
                block text-xs font-medium mb-2
                ${isLightTheme ? 'text-neutral-600' : 'text-neutral-300'}
              `}>
                Família da Fonte
              </label>
              <select className={`
                w-full px-3 py-2 rounded text-sm
                ${isLightTheme
                  ? 'bg-white border border-neutral-300 text-neutral-700'
                  : 'bg-neutral-800 border border-white/10 text-neutral-300'
                }
              `}>
                <option>Arial</option>
                <option>Helvetica</option>
                <option>Times New Roman</option>
                <option>Courier New</option>
                <option>Georgia</option>
              </select>
            </div>

            {/* Tamanho da Fonte */}
            <div>
              <label className={`
                block text-xs font-medium mb-2
                ${isLightTheme ? 'text-neutral-600' : 'text-neutral-300'}
              `}>
                Tamanho da Fonte
              </label>
              <input
                type="range"
                min="8"
                max="72"
                defaultValue="16"
                className="w-full"
              />
            </div>

            {/* Alinhamento */}
            <div>
              <label className={`
                block text-xs font-medium mb-2
                ${isLightTheme ? 'text-neutral-600' : 'text-neutral-300'}
              `}>
                Alinhamento
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Esquerda', 'Centro', 'Direita'].map((align) => (
                  <button
                    key={align}
                    className={`
                      px-3 py-2 rounded text-sm
                      transition-colors
                      ${isLightTheme
                        ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }
                    `}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacidade */}
            <div>
              <label className={`
                block text-xs font-medium mb-2
                ${isLightTheme ? 'text-neutral-600' : 'text-neutral-300'}
              `}>
                Opacidade
              </label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="100"
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
                {['Frente', 'Meio', 'Atrás'].map((layer) => (
                  <button
                    key={layer}
                    className={`
                      w-full px-3 py-2 rounded text-sm text-left
                      transition-colors
                      ${isLightTheme
                        ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }
                    `}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default EditorSidePanel;

