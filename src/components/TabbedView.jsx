import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlock from '@tiptap/extension-code-block';
import EditorToolbar from './EditorToolbar';
import { Plus, X, FolderOpen } from 'lucide-react';
import { useExportShortcut } from '../hooks/useExportShortcut';
import { useEditorShortcuts } from '../hooks/useKeyboardShortcuts';
import { pluginManager } from '../plugins/core/PluginManager';
import { openFile } from '../utils/openFileUtils';
import { extractTitleFromFileName } from '../utils/fileUtils';
import { useTheme } from '../contexts/ThemeContext';

// Função auxiliar para extrair título da nota do HTML
const getNoteTitle = (html) => {
  if (!html) return 'Sem título';
  
  // Criar um elemento temporário para parsear o HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Tentar pegar o primeiro heading
  const heading = tempDiv.querySelector('h1, h2');
  if (heading) {
    return heading.textContent.trim() || 'Sem título';
  }
  
  // Tentar pegar o primeiro parágrafo
  const paragraph = tempDiv.querySelector('p');
  if (paragraph) {
    const text = paragraph.textContent.trim();
    return text.length > 30 ? text.substring(0, 30) + '...' : text || 'Sem título';
  }
  
  return 'Sem título';
};

function TabbedView({ notesState, selectedNoteId, onNoteSelected, onOpenFileReady }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { notes, addNote, updateNoteContent, updateNoteTitle, deleteNote, reorderNotes } = notesState;
  const [activeNoteId, setActiveNoteId] = useState(notes.length > 0 ? notes[0]?.id : null);
  const [draggedTabId, setDraggedTabId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Atualizar nota ativa quando selectedNoteId mudar (da busca)
  useEffect(() => {
    if (selectedNoteId && notes.find(n => n.id === selectedNoteId)) {
      setActiveNoteId(selectedNoteId);
      if (onNoteSelected) {
        setTimeout(() => onNoteSelected(), 500);
      }
    }
  }, [selectedNoteId, notes, onNoteSelected]);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const titleInputRef = useRef(null);
  const pendingNoteIdRef = useRef(null); // Para rastrear nota pendente de ativação

  // Atualizar nota ativa quando a lista mudar
  useEffect(() => {
    if (notes.length > 0 && (!activeNoteId || !notes.find(n => n.id === activeNoteId))) {
      setActiveNoteId(notes[0].id);
    } else if (notes.length === 0) {
      setActiveNoteId(null);
    }
    
    // Se há uma nota pendente de ativação, ativá-la quando ela aparecer no array
    if (pendingNoteIdRef.current) {
      const pendingNote = notes.find(n => n.id === pendingNoteIdRef.current);
      if (pendingNote) {
        setActiveNoteId(pendingNoteIdRef.current);
        pendingNoteIdRef.current = null; // Limpar referência
      }
    }
  }, [notes, activeNoteId]);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        // Desabilitar underline do StarterKit pois vamos usar o separado
        underline: false,
      }),
      Placeholder.configure({
        placeholder: 'Digite algo incrível...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      TaskList.configure({
        nested: true,
      }),
      TaskItem.configure({
        nested: true,
      }),
      CodeBlock,
    ],
    // Sempre usar o conteúdo da nota ativa, mesmo que seja vazio
    // Isso garante que arquivos abertos sejam carregados corretamente
    content: activeNote?.content ?? '',
    editorProps: {
      attributes: {
        class: 'tiptap focus:outline-none px-6 py-4 text-white/90 min-h-full leading-relaxed',
        spellcheck: 'true', // Ativar correção ortográfica nativa do Windows
        contenteditable: 'true',
      },
      handleDOMEvents: {
        // Permitir menu de contexto nativo do navegador
        contextmenu: (view, event) => {
          // Não prevenir o comportamento padrão - deixar o menu nativo aparecer
          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      if (!activeNoteId) return;
      
      // Remover debounce manual - o autoSaveManager já cuida disso
      // Atualizar conteúdo imediatamente (o autoSaveManager fará o debounce)
      const html = editor.getHTML();
      updateNoteContent(activeNoteId, html);
    },
  }, [activeNoteId]); // Recriar editor quando a nota ativa mudar

  // Atualizar o conteúdo do editor quando a nota ativa mudar
  // Usar false para não disparar onUpdate (evitar loop)
  useEffect(() => {
    if (!editor || !activeNote || editor.isDestroyed) return;
    
    // Quando a nota muda (por ID), sempre atualizar o conteúdo
    // Isso garante que arquivos abertos sejam carregados corretamente
    const newContent = activeNote.content || '';
    
    // Usar um pequeno delay para garantir que o editor está totalmente inicializado
    const timeoutId = setTimeout(() => {
      if (editor && !editor.isDestroyed && activeNote) {
        try {
          const currentContent = editor.getHTML();
          // Só atualizar se o conteúdo realmente mudou
          if (currentContent.trim() !== newContent.trim()) {
            editor.commands.setContent(newContent, false);
          }
        } catch (error) {
          console.error('Erro ao atualizar conteúdo do editor:', error);
        }
      }
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [activeNote?.id, activeNote?.content, editor]);

  // Destruir editor ao desmontar
  useEffect(() => {
    return () => {
      // Destruir editor ao desmontar para evitar memory leaks
      if (editor && !editor.isDestroyed) {
        editor.destroy();
      }
    };
  }, [editor]);

  // Obter título da nota (customizado ou extraído)
  const getCurrentNoteTitle = () => {
    if (!activeNote) return 'nota';
    return activeNote.title || getNoteTitle(activeNote.content);
  };

  // Atalho de exportação (Ctrl+Shift+S)
  useExportShortcut(editor, getCurrentNoteTitle(), !!activeNote);
  
  // Ativar atalhos do editor quando houver nota ativa
  useEditorShortcuts(editor, !!activeNote);

  const handleAddNote = () => {
    const newNoteId = addNote();
    setActiveNoteId(newNoteId);
  };

  // Handler para abrir arquivo
  const handleOpenFile = useCallback(async () => {
    try {
      const result = await openFile();
      
      if (result && result.success && !result.canceled) {
        // Definir título baseado no nome do arquivo
        const title = extractTitleFromFileName(result.fileName);
        
        // Criar nova nota COM o conteúdo e título já definidos
        const newNoteId = addNote(result.content, title);
        
        // Marcar a nota como pendente de ativação
        // O useEffect acima vai ativá-la quando ela aparecer no array notes
        pendingNoteIdRef.current = newNoteId;
        
        // Garantir que o editor receba o foco após abrir arquivo
        // Usar um delay maior para garantir que o editor foi recriado
        setTimeout(() => {
          const editorElement = document.querySelector('.tiptap');
          if (editorElement) {
            try {
              editorElement.focus();
            } catch (e) {
              // Ignorar erros de foco
            }
          }
        }, 400);
        
        console.log('Arquivo aberto com sucesso:', result.fileName);
      }
    } catch (error) {
      console.error('Erro ao abrir arquivo:', error);
    }
  }, [addNote]);

  // Expor handler para o componente pai (para Ctrl+O)
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

  const handleDeleteNote = (e, noteId) => {
    e.stopPropagation();
    if (notes.length === 1) {
      deleteNote(noteId);
      setActiveNoteId(null);
    } else {
      const currentIndex = notes.findIndex(n => n.id === noteId);
      deleteNote(noteId);
      
      // Ativar a próxima nota ou a anterior
      if (currentIndex < notes.length - 1) {
        setActiveNoteId(notes[currentIndex + 1].id);
      } else if (currentIndex > 0) {
        setActiveNoteId(notes[currentIndex - 1].id);
      }
    }
  };

  const handleTitleDoubleClick = (e, noteId) => {
    e.stopPropagation();
    const note = notes.find(n => n.id === noteId);
    const currentTitle = note?.title || getNoteTitle(note?.content);
    setEditingTitleId(noteId);
    setEditingTitleValue(currentTitle);
  };

  const handleTitleSave = (noteId) => {
    if (editingTitleValue.trim()) {
      updateNoteTitle(noteId, editingTitleValue.trim());
    } else {
      updateNoteTitle(noteId, null);
    }
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  const handleTitleKeyDown = (e, noteId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave(noteId);
    } else if (e.key === 'Escape') {
      setEditingTitleId(null);
      setEditingTitleValue('');
    }
  };

  // Handlers para drag-and-drop das abas
  const handleDragStart = (e, noteId, index) => {
    setDraggedTabId(noteId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', noteId);
  };

  const handleDragEnd = (e) => {
    setDraggedTabId(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const dragIndex = notes.findIndex(n => n.id === draggedTabId);
    // Só mostrar feedback se não for a mesma posição
    if (dragIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedTabId === null) return;
    
    const dragIndex = notes.findIndex(n => n.id === draggedTabId);
    if (dragIndex === -1 || dragIndex === dropIndex) {
      setDraggedTabId(null);
      setDragOverIndex(null);
      return;
    }

    // Reordenar as notas
    reorderNotes(dragIndex, dropIndex);
    
    // Limpar estados
    setDraggedTabId(null);
    setDragOverIndex(null);
  };

  // Focar no input quando começar a editar
  useEffect(() => {
    if (editingTitleId && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitleId]);

  if (notes.length === 0) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${isLight ? 'bg-neutral-50' : 'bg-neutral-950'}`}>
        <div className="text-center">
          <p className={`text-lg mb-4 font-medium ${isLight ? 'text-neutral-800' : 'text-neutral-200'}`}>Nenhuma nota ainda</p>
          <button
            onClick={handleAddNote}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            Criar primeira nota
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col ${isLight ? 'bg-neutral-50' : 'bg-neutral-950'}`}>
      {/* Barra de Abas */}
      <div 
        className={`flex items-center gap-1 px-2 border-b overflow-x-auto scrollbar-hide ${
          isLight ? 'bg-white/95 border-neutral-200' : 'bg-neutral-900/50 border-white/10'
        }`}
        style={{ 
          WebkitAppRegion: 'no-drag',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {notes.map((note, index) => (
          <div
            key={note.id}
            draggable
            onDragStart={(e) => handleDragStart(e, note.id, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onClick={() => setActiveNoteId(note.id)}
            className={`
              flex items-center gap-2 px-4 py-2
              border-b-2
              ${draggedTabId === note.id 
                ? 'cursor-grabbing bg-blue-500/30 border-blue-500 opacity-80' 
                : 'cursor-grab'
              }
              ${activeNoteId === note.id && draggedTabId !== note.id
                ? isLight
                  ? 'bg-neutral-100 border-blue-600 text-neutral-900'
                  : 'bg-neutral-800 border-blue-500 text-white'
                : draggedTabId !== note.id
                ? isLight
                  ? 'bg-transparent border-transparent text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900'
                  : 'bg-transparent border-transparent text-neutral-300 hover:bg-neutral-800/50 hover:text-white'
                : ''
              }
              ${dragOverIndex === index && draggedTabId !== note.id 
                ? 'bg-yellow-500/30 border-yellow-500' 
                : ''
              }
            `}
            style={{ WebkitAppRegion: 'no-drag' }}
          >
            {editingTitleId === note.id ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editingTitleValue}
                onChange={(e) => setEditingTitleValue(e.target.value)}
                onBlur={() => handleTitleSave(note.id)}
                onKeyDown={(e) => handleTitleKeyDown(e, note.id)}
                onMouseDown={(e) => e.stopPropagation()} // Prevenir drag ao clicar no input
                className={`text-sm font-medium bg-transparent border-none outline-none flex-1 min-w-0 ${isLight ? 'text-neutral-900' : 'text-white'}`}
                style={{ WebkitAppRegion: 'no-drag' }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span 
                className="text-sm font-medium whitespace-nowrap"
                onDoubleClick={(e) => handleTitleDoubleClick(e, note.id)}
                onMouseDown={(e) => {
                  // Permitir drag apenas se não for duplo clique
                  if (e.detail === 2) {
                    e.stopPropagation();
                  }
                }}
              >
                {note.title || getNoteTitle(note.content)}
              </span>
            )}
            <button
              onClick={(e) => handleDeleteNote(e, note.id)}
              onMouseDown={(e) => e.stopPropagation()} // Prevenir que inicie drag ao clicar no X
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-red-500/20 hover:text-red-400"
              style={{ WebkitAppRegion: 'no-drag' }}
              title="Fechar aba"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {/* Botões de ação */}
        <div className="flex items-center gap-1 ml-2">
          {/* Botão Abrir Arquivo */}
          <button
            onClick={handleOpenFile}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              isLight
                ? 'text-neutral-600 hover:bg-green-500/15 hover:text-green-700'
                : 'text-neutral-300 hover:bg-green-500/20 hover:text-green-400'
            }`}
            style={{ WebkitAppRegion: 'no-drag' }}
            title="Abrir arquivo (Ctrl+O)"
          >
            <FolderOpen size={16} />
          </button>

          {/* Botão Adicionar Nova Nota */}
          <button
            onClick={handleAddNote}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
              isLight
                ? 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
            }`}
            style={{ WebkitAppRegion: 'no-drag' }}
            title="Nova nota"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Editor Principal */}
      {activeNote && editor && !editor.isDestroyed ? (
        <>
          {/* Toolbar Fixa - Logo abaixo das abas */}
          <EditorToolbar 
            editor={editor} 
            variant="fixed"
            theme={isLight ? 'light' : 'dark'}
            noteTitle={getCurrentNoteTitle()}
            onExport={() => {
              // Função será implementada no EditorToolbar
            }}
          />

          {/* Área de Edição - Com scroll independente */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <EditorContent editor={editor} className="tiptap" />
          </div>

          {/* Componentes de Plugins */}
          <div className={`border-t ${isLight ? 'border-neutral-200' : 'border-white/10'}`}>
            {(() => {
              const WordCounter = pluginManager.getComponent('word-counter.WordCounter');
              const noteTitle = getCurrentNoteTitle();
              
              return (
                <>
                  {WordCounter && <WordCounter editor={editor} noteTitle={noteTitle} />}
                </>
              );
            })()}
          </div>
        </>
      ) : activeNote ? (
        <div className="flex-1 flex items-center justify-center">
          <p className={isLight ? 'text-neutral-600' : 'text-neutral-400'}>Carregando editor...</p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Selecione uma nota para editar</p>
        </div>
      )}
    </div>
  );
}

export default TabbedView;

