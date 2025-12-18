import { useState, useEffect, useRef } from 'react';
import { X, Search, ChevronUp, ChevronDown, FileText } from 'lucide-react';

function SearchModal({ isOpen, onClose, notes, onSelectNote }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Focar no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Buscar nas notas quando o query mudar
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches = [];

    notes.forEach((note) => {
      // Buscar no conteúdo HTML (texto puro)
      const textContent = stripHtml(note.content).toLowerCase();
      const title = (note.title || extractTitle(note.content) || 'Sem título').toLowerCase();

      // Buscar no título
      if (title.includes(query)) {
        matches.push({
          noteId: note.id,
          noteTitle: note.title || extractTitle(note.content) || 'Sem título',
          matchType: 'title',
          matchText: note.title || extractTitle(note.content) || 'Sem título',
          preview: getPreview(textContent, query, 100),
        });
      }

      // Buscar no conteúdo
      if (textContent.includes(query) && !matches.some(m => m.noteId === note.id && m.matchType === 'title')) {
        const matchIndex = textContent.indexOf(query);
        const start = Math.max(0, matchIndex - 50);
        const end = Math.min(textContent.length, matchIndex + query.length + 50);
        const preview = textContent.substring(start, end);

        matches.push({
          noteId: note.id,
          noteTitle: note.title || extractTitle(note.content) || 'Sem título',
          matchType: 'content',
          matchText: preview,
          preview: getPreview(textContent, query, 100),
        });
      }
    });

    setResults(matches);
    setSelectedIndex(0);
  }, [searchQuery, notes]);

  // Navegação com teclado
  useEffect(() => {
    // Verificação inicial: só escutar eventos quando o modal estiver aberto
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Verificação adicional para garantir que o modal está aberto
      if (!isOpen) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        handleSelectResult(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Scroll para o resultado selecionado
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleSelectResult = (result) => {
    if (onSelectNote) {
      onSelectNote(result.noteId);
    }
    onClose();
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-500/30 text-yellow-200 rounded px-1">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-700">
          <Search size={18} className="text-neutral-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar em todas as notas..."
            className="flex-1 bg-transparent text-white placeholder-neutral-500 outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
            title="Fechar (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto" ref={resultsRef}>
          {searchQuery.trim() && results.length === 0 ? (
            <div className="px-4 py-8 text-center text-neutral-500">
              Nenhum resultado encontrado
            </div>
          ) : !searchQuery.trim() ? (
            <div className="px-4 py-8 text-center text-neutral-500">
              Digite para buscar nas notas...
            </div>
          ) : (
            <div className="py-2">
              <div className="px-4 py-2 text-xs text-neutral-500 border-b border-neutral-800">
                {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
              </div>
              {results.map((result, index) => (
                <button
                  key={`${result.noteId}-${index}`}
                  onClick={() => handleSelectResult(result)}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-neutral-800 transition-colors
                    ${selectedIndex === index ? 'bg-neutral-800 border-l-2 border-blue-500' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <FileText size={16} className="text-neutral-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white mb-1">
                        {highlightText(result.noteTitle, searchQuery)}
                        {result.matchType === 'title' && (
                          <span className="ml-2 text-xs text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded">
                            Título
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400 line-clamp-2">
                        {highlightText(result.preview, searchQuery)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Dicas */}
        <div className="px-4 py-2 border-t border-neutral-700 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px]">↑↓</kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px]">Enter</kbd>
              Selecionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-[10px]">Esc</kbd>
              Fechar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Funções auxiliares
function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function extractTitle(content) {
  if (!content) return null;
  const text = stripHtml(content);
  const lines = text.split('\n').filter(line => line.trim());
  return lines[0] || null;
}

function getPreview(text, query, maxLength) {
  if (!text) return '';
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) {
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  }
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + query.length + 30);
  let preview = text.substring(start, end);
  if (start > 0) preview = '...' + preview;
  if (end < text.length) preview = preview + '...';
  return preview;
}

export default SearchModal;

