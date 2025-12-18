import { Plus, FolderOpen } from 'lucide-react';
import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import Note from './Note';
import { openFile } from '../utils/openFileUtils';
import { extractTitleFromFileName } from '../utils/fileUtils';

function NoteCanvas({ notesState, isDraggingAnyNote, setIsDraggingAnyNote, selectedNoteId, onNoteSelected, onOpenFileReady }) {
  const noteRefs = useRef({});
  const containerRef = useRef(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const {
    notes,
    addNote,
    updateNoteContent,
    updateNotePosition,
    updateNoteCollapsed,
    updateNoteSize,
    updateNoteTitle,
    deleteNote,
  } = notesState;

  // Handler para abrir arquivo
  const handleOpenFile = useCallback(async () => {
    try {
      const result = await openFile();
      
      if (result && result.success && !result.canceled) {
        // Definir título baseado no nome do arquivo
        const title = extractTitleFromFileName(result.fileName);
        
        // Criar nova nota COM o conteúdo e título já definidos
        // Isso evita problemas de sincronização e bugs de renderização
        addNote(result.content, title);
        
        console.log('Arquivo aberto com sucesso:', result.fileName);
      }
    } catch (error) {
      console.error('Erro ao abrir arquivo:', error);
    }
  }, [addNote]);

  // Expor handler para o componente pai (para Ctrl+O) - apenas quando solicitado
  // Usar ref para evitar loop infinito e chamadas automáticas
  const handleOpenFileRef = useRef(handleOpenFile);
  const hasExposedHandler = useRef(false);
  
  useEffect(() => {
    handleOpenFileRef.current = handleOpenFile;
  }, [handleOpenFile]);

  // Expor handler apenas uma vez quando o componente montar
  useEffect(() => {
    if (onOpenFileReady && !hasExposedHandler.current) {
      onOpenFileReady(() => handleOpenFileRef.current());
      hasExposedHandler.current = true;
    }
  }, [onOpenFileReady]);

  // Focar na nota selecionada quando selectedNoteId mudar
  useEffect(() => {
    if (selectedNoteId && noteRefs.current[selectedNoteId]) {
      const noteElement = noteRefs.current[selectedNoteId];
      if (noteElement) {
        // Scroll suave para a nota (usando o container pai)
        const noteContainer = noteElement.closest('.react-draggable');
        if (noteContainer) {
          noteContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Destacar a nota brevemente
          noteContainer.style.transition = 'box-shadow 0.3s';
          noteContainer.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.5)';
          setTimeout(() => {
            if (noteContainer) {
              noteContainer.style.boxShadow = '';
            }
          }, 2000);
        }
        // Callback para limpar seleção
        if (onNoteSelected) {
          setTimeout(() => onNoteSelected(), 2000);
        }
      }
    }
  }, [selectedNoteId, onNoteSelected]);

  // Memoizar handlers para evitar recriação e re-renders desnecessários em Note.jsx
  const handleContentChange = useCallback((noteId, newContent) => {
    updateNoteContent(noteId, newContent);
  }, [updateNoteContent]);

  const handlePositionChange = useCallback((noteId, position) => {
    updateNotePosition(noteId, position);
  }, [updateNotePosition]);

  const handleCollapseChange = useCallback((noteId, isCollapsed) => {
    updateNoteCollapsed(noteId, isCollapsed);
  }, [updateNoteCollapsed]);

  const handleSizeChange = useCallback((noteId, size) => {
    updateNoteSize(noteId, size);
  }, [updateNoteSize]);

  const handleTitleUpdate = useCallback((noteId, newTitle) => {
    updateNoteTitle(noteId, newTitle);
  }, [updateNoteTitle]);

  const handleDelete = useCallback((noteId) => {
    deleteNote(noteId);
  }, [deleteNote]);

  // Calcular viewport visível para virtualização
  useEffect(() => {
    const updateViewport = () => {
      try {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setViewport({
            x: -rect.left,
            y: -rect.top,
            width: window.innerWidth || 1200,
            height: window.innerHeight || 800,
          });
        } else {
          setViewport({
            x: 0,
            y: 0,
            width: window.innerWidth || 1200,
            height: window.innerHeight || 800,
          });
        }
      } catch (error) {
        console.error('Erro ao atualizar viewport:', error);
        // Fallback seguro
        setViewport({
          x: 0,
          y: 0,
          width: 1200,
          height: 800,
        });
      }
    };

    // Aguardar um frame para garantir que o DOM está pronto
    requestAnimationFrame(() => {
      updateViewport();
    });

    window.addEventListener('scroll', updateViewport, { passive: true });
    window.addEventListener('resize', updateViewport, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateViewport);
      window.removeEventListener('resize', updateViewport);
    };
  }, []);

  // Filtrar notas visíveis na viewport (virtualização)
  const visibleNotes = useMemo(() => {
    try {
      // Se há poucas notas (menos de 20), renderizar todas para melhor UX
      if (!notes || notes.length < 20) {
        return notes || [];
      }

      // Calcular quais notas estão visíveis na viewport
      const padding = 200; // Padding extra para renderizar notas próximas à borda
      return notes.filter((note) => {
        if (!note) return false;
        
        const noteX = note.x || 0;
        const noteY = note.y || 0;
        const noteWidth = note.width || 320;
        const noteHeight = note.isCollapsed ? 36 : (note.height || 320);

        // Verificar se a nota está dentro da viewport (com padding)
        return (
          noteX + noteWidth >= viewport.x - padding &&
          noteX <= viewport.x + viewport.width + padding &&
          noteY + noteHeight >= viewport.y - padding &&
          noteY <= viewport.y + viewport.height + padding
        );
      });
    } catch (error) {
      console.error('Erro ao filtrar notas visíveis:', error);
      // Fallback: retornar todas as notas em caso de erro
      return notes || [];
    }
  }, [notes, viewport]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative bg-transparent overflow-hidden"
      style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: 'transparent', overflow: 'hidden' }}
    >
      {/* Botões flutuantes */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-50">
        {/* Botão para abrir arquivo */}
        <button
          onClick={handleOpenFile}
          className="w-14 h-14 bg-gradient-to-br from-green-500/90 to-green-600/90 hover:from-green-500 hover:to-green-600 border border-green-400/20 rounded-2xl flex items-center justify-center text-white shadow-md group"
          title="Abrir arquivo (Ctrl+O)"
          style={{ 
            WebkitAppRegion: 'no-drag',
            position: 'relative',
          }}
        >
          <FolderOpen size={24} strokeWidth={2.5} />
        </button>

        {/* Botão flutuante para adicionar notas */}
        <button
          onClick={addNote}
          className="w-14 h-14 bg-gradient-to-br from-blue-500/90 to-blue-600/90 hover:from-blue-500 hover:to-blue-600 border border-blue-400/20 rounded-2xl flex items-center justify-center text-white shadow-md group"
          title="Adicionar nova nota"
          style={{ 
            WebkitAppRegion: 'no-drag',
          }}
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* Renderizar apenas notas visíveis (virtualização) */}
      {visibleNotes.map((note) => (
        <div
          key={note.id}
          ref={(el) => {
            if (el) noteRefs.current[note.id] = el;
          }}
        >
          <Note
            id={note.id}
            initialX={note.x}
            initialY={note.y}
            content={note.content}
            noteTitle={note.title}
            isCollapsed={note.isCollapsed || false}
            width={note.width || 320}
            height={note.height || 320}
            onContentChange={handleContentChange}
            onPositionChange={handlePositionChange}
            onCollapseChange={handleCollapseChange}
            onSizeChange={handleSizeChange}
            onUpdateTitle={handleTitleUpdate}
            onDelete={handleDelete}
            setIsDraggingAnyNote={setIsDraggingAnyNote}
            viewMode="canvas"
          />
        </div>
      ))}
    </div>
  );
}

export default NoteCanvas;
