import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockWithTheme from '../extensions/CodeBlockWithTheme';
import BlockquoteWithColor from '../extensions/BlockquoteWithColor';
import { useMemo } from 'react';
import EditorToolbar from './EditorToolbar';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { useCodeBlockLineNumbers } from '../hooks/useCodeBlockLineNumbers';
import { useBlockquoteColorObserver } from '../hooks/useBlockquoteColorObserver';
import { useCodeBlockThemeObserver } from '../hooks/useCodeBlockThemeObserver';
import EditorZoomControls from './EditorZoomControls';
import EditorSidePanel from './EditorSidePanel';
import DrawingToolsPanel from './DrawingToolsPanel';
import DrawingCanvas from './DrawingCanvas';
import SelectionPopup from './SelectionPopup';
import DrawingPropertiesPanel from './drawing/DrawingPropertiesPanel';
import { DrawingProvider, useDrawing } from '../contexts/DrawingContext';
import { useDrawingKeyboardShortcuts } from '../hooks/useDrawingKeyboardShortcuts';
import { useToastContext } from '../contexts/ToastContext';

function EditorViewContent() {
  const { theme, toggleTheme } = useTheme();
  const toast = useToastContext();
  const {
    selectedElementId,
    setSelectedElementId,
    getSelectedElement,
    cloneElement,
    deleteElement,
    selectedElementIds,
    cloneElements,
    deleteElements,
    drawingMode,
    exitDrawingMode,
  } = useDrawing();

  // Ativar atalhos de teclado para desenho
  useDrawingKeyboardShortcuts();
  // Memoizar extensões do Tiptap
  const extensions = useMemo(() => [
    StarterKit.configure({
      codeBlock: false,
      underline: false,
      blockquote: false, // Desabilitar blockquote padrão para usar o customizado
    }),
    Placeholder.configure({
      placeholder: 'Comece a escrever...',
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
    CodeBlockWithTheme, // Usar extensão customizada com suporte a temas
    BlockquoteWithColor, // Usar extensão customizada com suporte a cores
  ], []);

  // Memoizar editorProps com tema dinâmico
  const editorProps = useMemo(() => ({
    attributes: {
      class: `tiptap focus:outline-none min-h-full leading-relaxed ${
        theme === 'light' 
          ? 'text-neutral-900' 
          : 'text-white/90'
      }`,
      spellcheck: 'true',
      contenteditable: 'true',
    },
  }), [theme]);

  const editor = useEditor({
    extensions,
    content: '',
    editorProps,
  });

  // Adicionar numeração de linhas aos code blocks
  useCodeBlockLineNumbers(editor);
  
  // Manter cores dos blockquotes aplicadas
  useBlockquoteColorObserver(editor);
  
  // Manter temas dos code blocks aplicados
  useCodeBlockThemeObserver(editor);

  return (
    <div className={`w-full h-full flex flex-col transition-colors duration-300 ${
      theme === 'light' 
        ? 'bg-neutral-50' 
        : 'bg-neutral-950'
    }`}>
      {/* Painel Lateral Direito - Configurações */}
      <EditorSidePanel theme={theme} />
      
      {/* Painel Lateral Direito - Ferramentas de Desenho */}
      <DrawingToolsPanel theme={theme} />
      
      {/* Painel Lateral Esquerdo - Propriedades de Desenho */}
      {drawingMode && <DrawingPropertiesPanel theme={theme} />}

      {/* Toolbar Fixo no Topo - Ocultar quando em modo desenho */}
      {editor && !drawingMode && (
        <div className={`flex-shrink-0 border-b backdrop-blur-md ${
          theme === 'light'
            ? 'border-neutral-200 bg-white/80'
            : 'border-white/10 bg-neutral-900/50'
        }`}>
          <div className="max-w-6xl mx-auto px-6 py-3">
            <EditorToolbar 
              editor={editor} 
              isExpanded={true} 
              noteTitle="Editor"
              variant="floating"
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          </div>
        </div>
      )}

      {/* Área do Editor - Ocultar quando em modo desenho */}
      {!drawingMode && (
        <div 
          ref={(el) => {
            if (el) {
              // Encontrar o container de scroll para o canvas
              const scrollContainer = el.closest('.overflow-y-auto, .overflow-auto');
              if (scrollContainer) {
                scrollContainer.setAttribute('data-scroll-container', 'true');
              }
            }
          }}
          className="flex-1 overflow-y-auto scrollbar-thin relative"
          id="editor-scroll-container"
        >
          <div className="max-w-4xl mx-auto px-8 py-12 relative">
            {editor && (
              <div className="tiptap-wrapper relative">
                <EditorContent 
                  editor={editor}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Área de Desenho - Mostrar quando em modo desenho */}
      {drawingMode && (
        <div 
          className="flex-1 overflow-y-auto scrollbar-thin relative"
          id="editor-scroll-container"
          style={{ backgroundColor: theme === 'light' ? '#fafafa' : '#0a0a0a' }}
        >
          {/* Botão para sair do modo desenho */}
          <button
            onClick={exitDrawingMode}
            className={`
              fixed top-20 left-1/2 -translate-x-1/2 z-50
              px-4 py-2 rounded-lg shadow-lg
              flex items-center gap-2
              transition-all duration-200
              ${theme === 'light'
                ? 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
                : 'bg-neutral-800 text-white border border-white/10 hover:bg-neutral-700'
              }
            `}
            style={{ WebkitAppRegion: 'no-drag' }}
            title="Sair do modo desenho (voltar ao texto)"
          >
            <span className="text-sm font-medium">Modo Desenho Ativo</span>
            <span className="text-xs opacity-70">Clique para voltar ao texto</span>
          </button>
        </div>
      )}

      {/* Canvas de Desenho Fullscreen - Sobreposto */}
      <DrawingCanvas theme={theme} />

      {/* Rodapé com Controles de Zoom */}
      <EditorZoomControls theme={theme} />

      {/* Pop-up de Seleção */}
      <SelectionPopup
        theme={theme}
        selectedItem={getSelectedElement()}
        onClose={() => setSelectedElementId(null)}
        onClone={() => {
          if (selectedElementIds.length > 1) {
            cloneElements(selectedElementIds);
          } else if (selectedElementId) {
            cloneElement(selectedElementId);
          }
        }}
        onDelete={() => {
          if (selectedElementIds.length > 1) {
            deleteElements(selectedElementIds);
          } else if (selectedElementId) {
            deleteElement(selectedElementId);
          }
          setSelectedElementId(null);
        }}
        onLink={() => {
          console.log('Link item:', getSelectedElement());
          // Implementar lógica de link
        }}
      />
    </div>
  );
}

function EditorView() {
  return (
    <ThemeProvider>
      <DrawingProvider>
        <EditorViewContent />
      </DrawingProvider>
    </ThemeProvider>
  );
}

export default EditorView;

