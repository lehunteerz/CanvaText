import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlock from '@tiptap/extension-code-block';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import { X, Minus, ChevronDown, LayoutGrid, ChevronUp, GripHorizontal, FileEdit, Maximize2 } from 'lucide-react';
import EditorToolbar from './EditorToolbar';
import { useExportShortcut } from '../hooks/useExportShortcut';
import { useEditorShortcuts } from '../hooks/useKeyboardShortcuts';
import { pluginManager } from '../plugins/core/PluginManager';
import { detectFileFormat, getFormatName } from '../utils/fileUtils';
import { autoSaveNote } from '../utils/exportUtils';
import { throttle } from '../utils/throttle';

const Note = memo(function Note({ 
  id, 
  initialX, 
  initialY, 
  content,
  noteTitle: propNoteTitle,
  isCollapsed: initialCollapsed, 
  width = 320,
  height = 320,
  onContentChange, 
  onPositionChange, 
  onCollapseChange,
  onSizeChange,
  onUpdateTitle,
  onDelete,
  setIsDraggingAnyNote,
  viewMode = 'canvas'
}) {
  const dragStopTimeoutRef = useRef(null);
  const nodeRef = useRef(null);
  const editorScrollRef = useRef(null);
  
  // Criar versões throttled dos handlers para melhor performance
  const throttledPositionChange = useMemo(
    () => throttle((noteId, position) => {
      if (onPositionChange) {
        onPositionChange(noteId, position);
      }
    }, 100), // Throttle de 100ms para arrastar
    [onPositionChange]
  );

  const throttledSizeChange = useMemo(
    () => throttle((noteId, size) => {
      if (onSizeChange) {
        onSizeChange(noteId, size);
      }
    }, 150), // Throttle de 150ms para redimensionar
    [onSizeChange]
  );
  
  const [showToolbar, setShowToolbar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed || false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [isAtBoundary, setIsAtBoundary] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef(null);
  const fixedToolbarRef = useRef(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [currentNoteTitle, setCurrentNoteTitle] = useState(propNoteTitle);
  const renameInputRef = useRef(null);
  const statsBarRef = useRef(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  // Atualizar título quando prop mudar
  useEffect(() => {
    setCurrentNoteTitle(propNoteTitle);
  }, [propNoteTitle]);

  // Função auxiliar para extrair título do conteúdo
  const getNoteTitleFromContent = (html) => {
    if (!html) return 'Sem título';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const heading = tempDiv.querySelector('h1, h2');
    if (heading) {
      return heading.textContent.trim() || 'Sem título';
    }
    const paragraph = tempDiv.querySelector('p');
    if (paragraph) {
      const text = paragraph.textContent.trim();
      return text.length > 30 ? text.substring(0, 30) + '...' : text || 'Sem título';
    }
    return 'Sem título';
  };

  // Memoizar extensões do Tiptap para evitar recriação a cada render
  const extensions = useMemo(() => [
    StarterKit.configure({
      // Desabilitar codeBlock do StarterKit pois vamos usar o separado
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
  ], []);

  // Memoizar editorProps para evitar recriação a cada render
  const editorProps = useMemo(() => ({
    attributes: {
      class: 'tiptap focus:outline-none px-4 py-3 text-white/90 min-h-20 leading-relaxed',
      spellcheck: 'true', // Ativar correção ortográfica nativa do Windows
      contenteditable: 'true',
    },
    handleDOMEvents: {
      // Permitir menu de contexto nativo do navegador
      contextmenu: (view, event) => {
        // Não prevenir o comportamento padrão - deixar o menu nativo aparecer
        return false;
      },
      // Detectar foco no editor (para toolbar fixo no modo Canvas)
      // Os eventos de foco são tratados no useEffect abaixo para melhor controle
    },
  }), []);

  // Memoizar onUpdate handler para evitar recriação
  const handleEditorUpdate = useCallback(({ editor }) => {
    // Remover debounce manual - o autoSaveManager já cuida disso
    // Atualizar conteúdo imediatamente (o autoSaveManager fará o debounce)
    const html = editor.getHTML();
    onContentChange(id, html);

    // Auto-scroll para baixo quando o usuário digita (opcional, mas útil)
    // Usar requestAnimationFrame para garantir que o DOM foi atualizado
    requestAnimationFrame(() => {
      if (editorScrollRef.current) {
        const scrollContainer = editorScrollRef.current;
        const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
        
        // Só fazer auto-scroll se o usuário já estava perto do final
        // Isso evita scroll indesejado quando o usuário está lendo texto acima
        if (isNearBottom) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    });
  }, [id, onContentChange]);

  const editor = useEditor({
    extensions,
    content: content || '',
    editorProps,
    onUpdate: handleEditorUpdate,
  });

  // Limpar timeouts ao desmontar o componente
  useEffect(() => {
    return () => {
      // saveTimeoutRef removido - autoSaveManager cuida do debounce
      if (dragStopTimeoutRef.current) {
        clearTimeout(dragStopTimeoutRef.current);
      }
    };
  }, []);

  // Atualizar o conteúdo do editor quando o conteúdo externo mudar
  // Usar false para não disparar onUpdate (evitar loop)
  useEffect(() => {
    if (!editor) return;
    
    const currentContent = editor.getHTML();
    // Só atualizar se o conteúdo realmente mudou (evitar loops)
    if (content !== currentContent && content !== undefined) {
      editor.commands.setContent(content || '', false);
    }
  }, [content, editor]);

  // Detectar foco no editor usando eventos do DOM (para toolbar fixo no modo Canvas)
  useEffect(() => {
    if (!editor || viewMode !== 'canvas' || isCollapsed) {
      setIsEditorFocused(false);
      return;
    }

    let cleanup = null;
    let timeoutId = null;
    let retryCount = 0;
    const maxRetries = 10;

    // Aguardar o editor estar totalmente inicializado
    const setupFocusDetection = () => {
      try {
        if (!editor || !editor.view) {
          retryCount++;
          if (retryCount < maxRetries) {
            timeoutId = setTimeout(setupFocusDetection, 100);
          }
          return;
        }

        const editorElement = editor.view.dom;
        if (!editorElement) {
          retryCount++;
          if (retryCount < maxRetries) {
            timeoutId = setTimeout(setupFocusDetection, 100);
          }
          return;
        }

        const handleFocus = () => {
          setIsEditorFocused(true);
        };

        const handleBlur = () => {
          // Verificar se o foco não foi para outro elemento da mesma nota
          setTimeout(() => {
            if (editor && editorElement && document.activeElement !== editorElement && !editorElement.contains(document.activeElement)) {
              setIsEditorFocused(false);
            }
          }, 150);
        };

        // Usar capture para garantir que capturamos o evento
        editorElement.addEventListener('focus', handleFocus, true);
        editorElement.addEventListener('blur', handleBlur, true);
        
        // Também usar eventos do Tiptap (se disponível)
        if (editor.on) {
          editor.on('focus', handleFocus);
          editor.on('blur', handleBlur);
        }

        // Verificar foco inicial
        try {
          const hasFocus = document.activeElement === editorElement || 
                          editorElement.contains(document.activeElement) || 
                          (editor.isFocused && typeof editor.isFocused === 'function' ? editor.isFocused() : false);
          if (hasFocus) {
            setIsEditorFocused(true);
          }
        } catch (e) {
          // Ignorar erro se isFocused não for uma função
        }

        cleanup = () => {
          if (editorElement) {
            editorElement.removeEventListener('focus', handleFocus, true);
            editorElement.removeEventListener('blur', handleBlur, true);
          }
          if (editor && editor.off) {
            editor.off('focus', handleFocus);
            editor.off('blur', handleBlur);
          }
        };
      } catch (error) {
        console.error('Erro ao configurar detecção de foco:', error);
      }
    };

    // Aguardar um frame para garantir que o DOM está pronto
    requestAnimationFrame(() => {
      timeoutId = setTimeout(setupFocusDetection, 50);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (cleanup) cleanup();
    };
  }, [editor, viewMode, isCollapsed]);

  // Salvar posição apenas ao soltar a nota (onStop) com detecção de lixeira
  const handleDragStop = useCallback((e, data) => {
    setIsDragging(false);
    setIsAtBoundary(false);
    if (setIsDraggingAnyNote) {
      setIsDraggingAnyNote(false);
    }

    // Limpar timeout anterior se existir
    if (dragStopTimeoutRef.current) {
      clearTimeout(dragStopTimeoutRef.current);
    }

    // Detecção de colisão com a lixeira
    // Usa um pequeno delay para garantir que o DOM esteja atualizado
    dragStopTimeoutRef.current = setTimeout(() => {
      // Tenta obter as coordenadas do mouse do evento
      let clientX, clientY;
      
      if (e && e.clientX !== undefined) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if (e && e.nativeEvent) {
        clientX = e.nativeEvent.clientX;
        clientY = e.nativeEvent.clientY;
      } else {
        // Fallback: usa a posição do elemento da nota
        const noteElement = nodeRef.current;
        if (noteElement) {
          const rect = noteElement.getBoundingClientRect();
          clientX = rect.left + rect.width / 2;
          clientY = rect.top + rect.height / 2;
        }
      }

      if (clientX !== undefined && clientY !== undefined) {
        const elementAtPoint = document.elementFromPoint(clientX, clientY);
        const trashZone = elementAtPoint?.closest('#trash-zone');

        if (trashZone) {
          // Se soltou sobre a lixeira, deleta a nota
          onDelete(id);
          return;
        }
      }

      // Caso contrário, apenas atualiza a posição (usando throttle)
      throttledPositionChange(id, { x: data.x, y: data.y });
      dragStopTimeoutRef.current = null;
    }, 50);
  }, [id, setIsDraggingAnyNote, onDelete, throttledPositionChange]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    setIsAtBoundary(false);
    if (setIsDraggingAnyNote) {
      setIsDraggingAnyNote(true);
    }
  }, [setIsDraggingAnyNote]);

  const handleDrag = useCallback((e, data) => {
    // Detectar se está próximo dos limites
    const noteWidth = width;
    const noteHeight = isCollapsed ? 36 : height;
    const titleBarHeight = 32; // Altura do TitleBar
    const padding = 5; // Espaço mínimo da borda para feedback visual
    
    const isAtLeft = data.x <= padding;
    const isAtRight = data.x >= window.innerWidth - noteWidth - padding;
    const isAtTop = data.y <= titleBarHeight + padding;
    const isAtBottom = data.y >= window.innerHeight - noteHeight - 80 - padding;
    
    setIsAtBoundary(isAtLeft || isAtRight || isAtTop || isAtBottom);
  }, [width, height, isCollapsed]);

  const handleResizeStop = useCallback((e, direction, ref, d) => {
    const newWidth = width + d.width;
    const newHeight = height + d.height;
    // Usar throttle para evitar muitas atualizações durante o resize
    throttledSizeChange(id, { width: newWidth, height: newHeight });
  }, [id, width, height, throttledSizeChange]);

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (onCollapseChange) {
      onCollapseChange(id, newCollapsed);
    }
  };

  const handleHeaderDoubleClick = () => {
    handleToggleCollapse();
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Backspace ou Delete para deletar nota
    if ((e.ctrlKey || e.metaKey) && (e.key === 'Backspace' || e.key === 'Delete')) {
      onDelete(id);
      e.preventDefault();
    }
  };

  // Obter primeira linha do conteúdo para preview quando colapsado
  const getPreviewText = useCallback(() => {
    if (!editor) return '';
    const text = editor.getText();
    const firstLine = text.split('\n')[0];
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
  }, [editor]);

  // Obter título atual (customizado ou extraído)
  const getCurrentTitle = useCallback(() => {
    return currentNoteTitle || getNoteTitleFromContent(content) || (editor ? getPreviewText() : '') || 'nota';
  }, [currentNoteTitle, content, editor, getPreviewText]);



  // Handler para iniciar renomeio
  const handleStartRename = useCallback(() => {
    const currentTitle = getCurrentTitle();
    const format = detectFileFormat(currentTitle);
    const nameWithoutExt = format ? currentTitle.replace(/\.[^/.]+$/, '') : currentTitle;
    setRenameValue(nameWithoutExt);
    setIsRenaming(true);
    setTimeout(() => {
      if (renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
      }
    }, 0);
  }, [getCurrentTitle]);

  // Handler para confirmar renomeio
  const handleConfirmRename = useCallback(async () => {
    if (renameValue.trim()) {
      const trimmedValue = renameValue.trim();
      
      // Primeiro verificar se o valor digitado já tem uma extensão
      const formatInNewValue = detectFileFormat(trimmedValue);
      
      let newTitle;
      if (formatInNewValue) {
        // Se o usuário já digitou uma extensão, usar diretamente
        newTitle = trimmedValue;
      } else {
        // Se não tem extensão, usar o formato do título antigo (se existir)
        const oldFormat = detectFileFormat(getCurrentTitle());
        newTitle = oldFormat ? `${trimmedValue}.${oldFormat}` : trimmedValue;
      }
      
      if (onUpdateTitle) {
        onUpdateTitle(id, newTitle);
      }
      setCurrentNoteTitle(newTitle);
      setIsRenaming(false);
      
      // Salvar automaticamente após renomear (com delay para evitar conflitos)
      if (editor) {
        try {
          // Usar setTimeout para garantir que o estado foi atualizado antes de salvar
          setTimeout(async () => {
            try {
              await autoSaveNote(editor, newTitle);
            } catch (error) {
              console.error('Erro ao salvar após renomear:', error);
            }
          }, 100);
        } catch (error) {
          console.error('Erro ao agendar salvamento após renomear:', error);
        }
      }
    } else {
      setIsRenaming(false);
    }
  }, [renameValue, getCurrentTitle, onUpdateTitle, id, editor]);

  // Handler para cancelar renomeio
  const handleCancelRename = useCallback(() => {
    setIsRenaming(false);
    setRenameValue('');
  }, []);

  // Atalho de exportação (Shift+S) - só funciona quando a nota não está colapsada
  // Usar useMemo para evitar recriação constante do título
  const currentTitleMemo = useMemo(() => getCurrentTitle(), [getCurrentTitle]);
  useExportShortcut(editor, currentTitleMemo, !isCollapsed);
  
  // Ativar atalhos do editor quando a nota não estiver colapsada
  useEditorShortcuts(editor, !isCollapsed);

  // Calcular bounds para manter a nota dentro da tela
  // Considera o tamanho da nota, TitleBar e deixa espaço para a lixeira
  const noteHeight = isCollapsed ? 36 : height;
  const titleBarHeight = 32; // Altura do TitleBar (h-8 = 32px)
  const bounds = {
    left: 0,
    top: titleBarHeight,
    right: window.innerWidth - width,
    bottom: window.innerHeight - noteHeight - 80, // Espaço para lixeira e botões
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={{ x: initialX, y: initialY }}
      onStart={handleDragStart}
      onDrag={handleDrag}
      onStop={handleDragStop}
      handle=".note-handle"
      cancel=".tiptap, .editor-toolbar, .editor-toolbar button, .note-collapse-btn, .note-delete-btn, .note-expand-toolbar-btn, .note-rename-btn, .re-resizable-handle"
      bounds={bounds}
    >
      <div 
        ref={nodeRef}
        className="absolute"
        style={{
          WebkitAppRegion: 'no-drag',
          overflow: 'visible' // Permitir que toolbar expandida apareça fora
        }}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => !isDragging && !isCollapsed && !isToolbarExpanded && setShowToolbar(true)}
        onMouseLeave={() => !isToolbarExpanded && setShowToolbar(false)}
      >
        <Resizable
          size={{ width: width, height: isCollapsed ? 36 : height }}
          minWidth={200}
          minHeight={isCollapsed ? 36 : 160}
          maxWidth={window.innerWidth - 40}
          maxHeight={window.innerHeight - 120}
          onResizeStop={handleResizeStop}
          enable={{
            top: false,
            right: true,
            bottom: true,
            left: false,
            topRight: false,
            bottomRight: true,
            bottomLeft: false,
            topLeft: false
          }}
          handleStyles={{
            right: { width: '4px', right: '0' },
            bottom: { height: '4px', bottom: '0' },
            bottomRight: { width: '12px', height: '12px', right: '0', bottom: '0' }
          }}
          handleClasses={{
            bottomRight: 'resize-handle'
          }}
        >
          <div 
            className={`
              w-full h-full
              ${isCollapsed ? 'min-h-9' : 'min-h-40'}
              bg-gradient-to-br from-neutral-800/95 via-neutral-800/90 to-neutral-800/95
              ${isAtBoundary ? 'border-2 border-red-500/50' : 'border border-white/10'}
              rounded-xl 
              ${isDragging ? 'shadow-lg' : 'shadow-md'}
              flex flex-col 
              overflow-hidden
              ${isDragging ? 'opacity-95' : ''}
            `}
            style={{ height: '100%' }}
          >
        {/* Área de arrasto (barra superior) - com duplo clique */}
        <div 
          className="note-handle h-9 bg-gradient-to-r from-white/5 to-white/3 border-b border-white/10 flex items-center justify-between px-3 cursor-grab drag-handle group"
          style={{ WebkitAppRegion: 'no-drag' }}
          onDoubleClick={handleHeaderDoubleClick}
        >
          {/* Indicadores de arrasto */}
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
          </div>

          {/* Preview quando colapsado ou título quando não está renomeando */}
          {isCollapsed ? (
            <span className="flex-1 text-xs text-white/60 mx-2 truncate">
              {getPreviewText() || 'Nota vazia'}
            </span>
          ) : isRenaming ? (
            <div className="flex-1 flex items-center gap-2 mx-2">
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmRename();
                  } else if (e.key === 'Escape') {
                    handleCancelRename();
                  }
                }}
                onBlur={handleConfirmRename}
                className="flex-1 text-xs bg-white/10 text-white px-2 py-1 rounded border border-blue-500/50 focus:border-blue-500 focus:outline-none"
                style={{ WebkitAppRegion: 'no-drag' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <span 
              className="flex-1 text-xs text-white/60 mx-2 truncate"
            >
              {getCurrentTitle()}
            </span>
          )}
          
          {/* Botões de ação */}
          <div className="flex items-center gap-1">
            {/* Botão Expandir Toolbar (só aparece se não estiver colapsado) */}
            {!isCollapsed && (
              <button 
                className="note-expand-toolbar-btn w-6 h-6 flex items-center justify-center text-white/80 hover:text-white hover:bg-blue-500/20 rounded no-drag"
                onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
                title={isToolbarExpanded ? 'Recolher Ferramentas' : 'Expandir Ferramentas'}
                style={{ WebkitAppRegion: 'no-drag' }}
              >
                {isToolbarExpanded ? (
                  <ChevronUp size={14} strokeWidth={2.5} />
                ) : (
                  <LayoutGrid size={14} strokeWidth={2.5} />
                )}
              </button>
            )}

            {/* Botão Renomear (só aparece se não estiver colapsado e não estiver renomeando) */}
            {!isCollapsed && !isRenaming && (
              <button 
                className="note-rename-btn w-6 h-6 flex items-center justify-center text-white/80 hover:text-white hover:bg-blue-500/20 rounded no-drag"
                onClick={handleStartRename}
                title="Renomear arquivo"
                style={{ WebkitAppRegion: 'no-drag' }}
              >
                <FileEdit size={14} strokeWidth={2.5} />
              </button>
            )}

            {/* Botão Colapsar/Expandir */}
            <button 
              className="note-collapse-btn w-6 h-6 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded no-drag"
              onClick={handleToggleCollapse}
              title={isCollapsed ? 'Expandir nota (ou duplo clique na barra)' : 'Colapsar nota (ou duplo clique na barra)'}
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              {isCollapsed ? (
                <ChevronDown size={14} strokeWidth={2.5} />
              ) : (
                <Minus size={14} strokeWidth={2.5} />
              )}
            </button>

            {/* Botão Deletar */}
            <button 
              className="note-delete-btn w-6 h-6 flex items-center justify-center text-white/80 hover:text-white hover:bg-red-500/20 rounded no-drag"
              onClick={() => onDelete(id)}
              title="Deletar nota (Ctrl+Backspace ou arraste para lixeira)"
              style={{ WebkitAppRegion: 'no-drag' }}
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

            {/* Conteúdo (só aparece se não estiver colapsado) */}
            {!isCollapsed && (
              <div className="flex-1 flex flex-col relative" style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Toolbar do Editor - Modo Normal (dentro da nota) - Só aparece se NÃO estiver no modo Canvas ou se o editor não tiver foco */}
                {viewMode !== 'canvas' && showToolbar && !isToolbarExpanded && (
                  <div 
                    className="px-3 pt-2.5 pb-2 flex-shrink-0"
                    style={{ WebkitAppRegion: 'no-drag' }}
                  >
                    <EditorToolbar 
                      editor={editor} 
                      isExpanded={false} 
                      noteTitle={getPreviewText() || 'nota'}
                      variant="floating"
                    />
                  </div>
                )}
                
                {/* Editor Content - Com scroll funcional */}
                <div 
                  ref={editorScrollRef}
                  className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30"
                  style={{ 
                    WebkitAppRegion: 'no-drag',
                    minHeight: 0,
                    flex: '1 1 auto',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    position: 'relative',
                  }}
                  onClick={() => {
                    // Garantir que o editor receba foco ao clicar na área
                    if (editor && viewMode === 'canvas') {
                      setTimeout(() => {
                        editor.commands.focus();
                        setIsEditorFocused(true);
                      }, 10);
                    }
                  }}
                >
                  <div className="tiptap-wrapper">
                    <EditorContent 
                      editor={editor} 
                      className="tiptap"
                    />
                  </div>
                </div>

                {/* Componentes de Plugins */}
                <div className="border-t border-white/10 relative" ref={statsBarRef}>
                  {(() => {
                    const WordCounter = pluginManager.getComponent('word-counter.WordCounter');
                    const displayTitle = getCurrentTitle();
                    
                    return (
                      <>
                        {WordCounter && (
                          <WordCounter 
                            editor={editor} 
                            noteTitle={displayTitle}
                            onSave={handleConfirmRename}
                            isRenaming={isRenaming}
                          />
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Toolbar Flutuante Desacoplada (via Portal) - Dock/Undock */}
            {isToolbarExpanded && !isCollapsed && createPortal(
              <Draggable
                nodeRef={toolbarRef}
                handle=".toolbar-drag-handle"
                defaultPosition={{
                  x: window.innerWidth / 2 - 250, // Centralizar (largura ~500px)
                  y: Math.max(32, window.innerHeight / 2 - 200), // Centralizar, mas respeitar TitleBar
                }}
                bounds="body"
                onStop={(e, data) => {
                  setToolbarPosition({ x: data.x, y: data.y });
                }}
              >
                <div
                  ref={toolbarRef}
                  className="fixed z-[9999] w-[500px] bg-neutral-900/95 border border-white/10 rounded-xl shadow-lg"
                  style={{ 
                    WebkitAppRegion: 'no-drag',
                    top: 0,
                    left: 0,
                  }}
                >
                  <EditorToolbar 
                    editor={editor} 
                    isExpanded={true} 
                    noteTitle={getPreviewText() || 'nota'}
                    variant="floating"
                    onClose={() => setIsToolbarExpanded(false)}
                  />
                </div>
              </Draggable>,
              document.body
            )}

            {/* Toolbar Fixo no Modo Canvas (via Portal) - Aparece quando o editor tem foco */}
            {viewMode === 'canvas' && !isCollapsed && isEditorFocused && editor && createPortal(
              <div
                ref={fixedToolbarRef}
                className="fixed top-[2.5rem] left-0 right-0 z-[9998] px-4 py-2 flex justify-center"
                style={{ 
                  WebkitAppRegion: 'no-drag',
                  pointerEvents: 'none',
                }}
              >
                <div
                  className="flex items-center gap-0.5 bg-neutral-800/95 backdrop-blur-md rounded-lg p-1 border border-white/10 overflow-x-auto scrollbar-hide flex-nowrap shadow-lg"
                  style={{ 
                    WebkitAppRegion: 'no-drag',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    pointerEvents: 'auto',
                    maxWidth: '90%',
                  }}
                >
                  <EditorToolbar 
                    editor={editor} 
                    isExpanded={false} 
                    noteTitle={getCurrentTitle() || 'nota'}
                    variant="floating"
                  />
                </div>
              </div>,
              document.body
            )}

            {/* Grip de redimensionamento (canto inferior direito) */}
            {!isCollapsed && (
              <div className="absolute bottom-0.5 right-0.5 cursor-nwse-resize text-neutral-500 opacity-30 hover:opacity-50 z-10 pointer-events-none transition-opacity">
                <Maximize2 size={10} strokeWidth={2.5} className="rotate-45" />
              </div>
            )}

          </div>
        </Resizable>
      </div>
    </Draggable>
  );
});

export default Note;
