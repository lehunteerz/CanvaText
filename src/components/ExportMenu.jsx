import { useState, useRef, useEffect } from 'react';
import { Download, FileText, Code, FileJson, FileCode, Save } from 'lucide-react';
import { exportNote, exportNoteUniversal } from '../utils/exportUtils';

const ExportMenu = ({ editor, noteTitle = 'nota' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleExport = async (format) => {
    setIsOpen(false);
    
    if (!editor) {
      console.error('Editor não disponível');
      return;
    }

    try {
      const result = await exportNote(editor, format, noteTitle);
      
      if (result && result.success) {
        // Opcional: mostrar notificação de sucesso
        console.log('Arquivo salvo em:', result.filePath);
      } else if (result && !result.canceled && result.error && result.error !== 'Exportação já em andamento') {
        console.error('Erro ao exportar:', result.error);
      }
    } catch (error) {
      console.error('Erro inesperado ao exportar:', error);
    }
  };

  const handleExportUniversal = async () => {
    setIsOpen(false);
    
    if (!editor) {
      console.error('Editor não disponível');
      return;
    }

    try {
      const result = await exportNoteUniversal(editor, noteTitle);
      
      if (result && result.success) {
        console.log('Arquivo salvo em:', result.filePath);
      } else if (result && !result.canceled && result.error && result.error !== 'Exportação já em andamento') {
        console.error('Erro ao exportar:', result.error);
      }
    } catch (error) {
      console.error('Erro inesperado ao exportar:', error);
    }
  };

  const exportOptions = [
    { format: 'universal', label: 'Salvar Como... (Ctrl+Shift+S)', icon: Save, action: handleExportUniversal },
    { format: 'markdown', label: 'Markdown (.md)', icon: FileText, action: handleExport },
    { format: 'html', label: 'HTML (.html)', icon: Code, action: handleExport },
    { format: 'text', label: 'Texto (.txt)', icon: FileText, action: handleExport },
    { format: 'json', label: 'JSON (.json)', icon: FileJson, action: handleExport },
  ];

  return (
    <div className="relative" ref={menuRef} style={{ WebkitAppRegion: 'no-drag' }}>
      <button
        onClick={handleExportUniversal}
        className="w-8 h-8 p-1 flex items-center justify-center rounded-md transition-colors duration-150 border-none outline-none flex-shrink-0 bg-transparent text-neutral-400 hover:bg-white/10 hover:text-white"
        title="Salvar Como... (Ctrl+Shift+S)"
      >
        <Download size={14} strokeWidth={2.5} />
      </button>

      {/* Menu dropdown (opcional - para formatos rápidos) */}
      {isOpen && (
        <div className="absolute top-10 right-0 bg-neutral-800/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl p-2 z-50 min-w-[220px]">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.format}
                onClick={option.action}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 rounded transition-colors ${
                  option.format === 'universal' ? 'border-b border-white/10 mb-1 pb-2' : ''
                }`}
              >
                <Icon size={14} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExportMenu;

