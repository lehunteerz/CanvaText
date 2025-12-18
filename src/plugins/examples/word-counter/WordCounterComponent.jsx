import { useEffect, useState } from 'react';
import { FileText, Check, Type, Hash, AlignLeft } from 'lucide-react';
import { detectFileFormat, getFormatName } from '../../../utils/fileUtils';

/**
 * Componente de contador de palavras
 * Mostra estatísticas do texto no editor
 * @param {Object} props - Props do componente
 * @param {Object} props.editor - Instância do editor Tiptap
 * @param {string} props.noteTitle - Título da nota (pode conter extensão)
 * @param {Function} props.onSave - Função para confirmar e salvar renomeio
 * @param {boolean} props.isRenaming - Se está em modo de renomeio
 */
function WordCounterComponent({ editor, noteTitle, onSave, isRenaming }) {
  const [stats, setStats] = useState({ words: 0, characters: 0, paragraphs: 0 });
  const [fileFormat, setFileFormat] = useState(null);

  useEffect(() => {
    if (!editor) return;

    const updateStats = () => {
      const text = editor.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const characters = text.length;
      const paragraphs = editor.state.doc.content.content.filter(
        node => node.type.name === 'paragraph' && node.textContent.trim()
      ).length;

      setStats({ words, characters, paragraphs });
    };

    // Atualizar ao editar
    editor.on('update', updateStats);
    editor.on('selectionUpdate', updateStats);

    // Atualizar inicialmente
    updateStats();

    return () => {
      editor.off('update', updateStats);
      editor.off('selectionUpdate', updateStats);
    };
  }, [editor]);

  // Detectar formato do arquivo baseado no título
  useEffect(() => {
    if (noteTitle) {
      const format = detectFileFormat(noteTitle);
      setFileFormat(format);
    } else {
      setFileFormat(null);
    }
  }, [noteTitle]);

  if (!editor) return null;

  return (
    <div className="flex items-center gap-3 sm:gap-4 px-3 py-2 bg-neutral-800/50 rounded-lg border border-white/5 text-xs">
      <div className="flex items-center gap-1.5 text-neutral-400">
        <FileText size={12} />
        <span className="font-medium hidden sm:inline">Estatísticas</span>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 text-neutral-300 flex-1 flex-wrap">
        <div className="flex items-center gap-1.5" title={`${stats.words} palavras`}>
          <Type size={14} className="text-blue-400" />
          <span className="text-blue-400 font-semibold">{stats.words}</span>
        </div>
        <span className="text-neutral-600">•</span>
        <div className="flex items-center gap-1.5" title={`${stats.characters} caracteres`}>
          <Hash size={14} className="text-blue-400" />
          <span className="text-blue-400 font-semibold">{stats.characters}</span>
        </div>
        {stats.paragraphs > 0 && (
          <>
            <span className="text-neutral-600">•</span>
            <div className="flex items-center gap-1.5" title={`${stats.paragraphs} parágrafos`}>
              <AlignLeft size={14} className="text-blue-400" />
              <span className="text-blue-400 font-semibold">{stats.paragraphs}</span>
            </div>
          </>
        )}
        {fileFormat && (
          <>
            <span className="text-neutral-600">•</span>
            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded">
              {getFormatName(fileFormat)}
            </span>
          </>
        )}
      </div>
      {isRenaming && onSave && (
        <button
          onClick={onSave}
          className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded transition-colors flex items-center gap-1"
          title="Confirmar renomeio e salvar"
          style={{ WebkitAppRegion: 'no-drag' }}
        >
          <Check size={12} />
          <span>Salvar</span>
        </button>
      )}
    </div>
  );
}

export default WordCounterComponent;

