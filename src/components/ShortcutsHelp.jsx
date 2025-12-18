import { memo } from 'react';
import { X } from 'lucide-react';

const SHORTCUTS = {
  'Geral': [
    { keys: 'Ctrl+Space', description: 'Abrir ajuda de atalhos' },
    { keys: 'Ctrl+N', description: 'Nova nota' },
    { keys: 'Ctrl+O', description: 'Abrir arquivo' },
    { keys: 'Ctrl+D', description: 'Duplicar nota' },
    { keys: 'Ctrl+F', description: 'Buscar em todas as notas' },
    { keys: 'Ctrl+Tab', description: 'Alternar modo (Canvas/Tabs)' },
    { keys: 'Ctrl+Shift+N', description: 'Nova nota rápida' },
    { keys: 'Ctrl+Backspace', description: 'Deletar nota atual' },
  ],
  'Edição': [
    { keys: 'Ctrl+B', description: 'Negrito' },
    { keys: 'Ctrl+I', description: 'Itálico' },
    { keys: 'Ctrl+U', description: 'Sublinhado' },
    { keys: 'Ctrl+Z', description: 'Desfazer' },
    { keys: 'Ctrl+Y', description: 'Refazer' },
    { keys: 'Ctrl+A', description: 'Selecionar tudo' },
  ],
  'Formatação': [
    { keys: 'Ctrl+1', description: 'Título 1' },
    { keys: 'Ctrl+2', description: 'Título 2' },
    { keys: 'Ctrl+0', description: 'Parágrafo' },
    { keys: 'Ctrl+Shift+L', description: 'Lista com marcadores' },
    { keys: 'Ctrl+Shift+O', description: 'Lista numerada' },
    { keys: 'Ctrl+`', description: 'Bloco de código' },
    { keys: 'Ctrl+Shift+Q', description: 'Citação' },
  ],
  'Salvamento': [
    { keys: 'Ctrl+S', description: 'Salvar automaticamente (Documentos\\CanvaText saved)' },
    { keys: 'Shift+S', description: 'Auto-save (backup automático)' },
    { keys: 'Ctrl+Shift+S', description: 'Exportar nota (Save As)' },
  ],
};

const ShortcutsHelp = memo(function ShortcutsHelp({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
      onClick={onClose}
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      <div 
        className="bg-neutral-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Atalhos de Teclado</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-6">
          {Object.entries(SHORTCUTS).map(([category, shortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-1">
                {shortcuts.map(({ keys, description }) => (
                  <div 
                    key={keys} 
                    className="flex justify-between items-center py-2 px-3 rounded hover:bg-white/5 transition-colors"
                  >
                    <span className="text-white/80 text-sm">{description}</span>
                    <kbd className="px-3 py-1.5 bg-neutral-800 rounded text-xs text-gray-300 font-mono border border-white/10">
                      {keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-gray-500">
            Pressione <kbd className="px-2 py-1 bg-neutral-800 rounded text-xs">Ctrl+Space</kbd> para abrir esta ajuda
          </p>
        </div>
      </div>
    </div>
  );
});

export default ShortcutsHelp;

