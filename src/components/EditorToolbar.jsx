import React from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Highlighter,
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Pilcrow,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  X,
  GripVertical,
  Moon,
  Sun
} from 'lucide-react';
import ExportMenu from './ExportMenu';
import BlockquoteButton from './BlockquoteButton';
import CodeBlockButton from './CodeBlockButton';

const EditorToolbar = ({ editor, isExpanded = false, noteTitle, variant = 'floating', onClose, theme = 'dark', onToggleTheme }) => {
  if (!editor) return null;

  // Função para toggle do parágrafo - se já está em parágrafo, limpa formatações
  const handleParagraphToggle = () => {
    const isParagraph = editor.isActive('paragraph') && 
      !editor.isActive('heading') && 
      !editor.isActive('bulletList') && 
      !editor.isActive('orderedList') && 
      !editor.isActive('taskList') && 
      !editor.isActive('blockquote') && 
      !editor.isActive('codeBlock');
    
    if (isParagraph) {
      // Se já está em parágrafo, limpa formatações inline e reseta alinhamento
      editor.chain()
        .focus()
        .unsetBold()
        .unsetItalic()
        .unsetUnderline()
        .unsetStrike()
        .unsetHighlight()
        .setTextAlign('left')
        .run();
    } else {
      // Se não está em parágrafo, converte para parágrafo
      editor.chain().focus().setParagraph().run();
    }
  };

  // Função auxiliar para criar botões com suporte a tema
  const createButton = (onClick, isActive, icon, title, disabled = false) => {
    const isLightTheme = theme === 'light';
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-8 h-8 p-1 flex items-center justify-center rounded-md
          transition-colors duration-150
          border-none outline-none flex-shrink-0
          ${disabled 
            ? 'opacity-30 cursor-not-allowed' 
            : isActive
              ? isLightTheme
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-white/20 text-blue-400'
              : isLightTheme
                ? 'bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                : 'bg-transparent text-neutral-400 hover:bg-white/10 hover:text-white'
          }
        `}
        style={{ WebkitAppRegion: 'no-drag' }}
        title={title}
      >
        {icon}
      </button>
    );
  };

  // Separador vertical com suporte a tema
  const Separator = () => {
    const isLightTheme = theme === 'light';
    return (
      <div 
        className={`w-px h-5 mx-0.5 flex-shrink-0 ${
          isLightTheme ? 'bg-neutral-300' : 'bg-white/10'
        }`} 
        style={{ WebkitAppRegion: 'no-drag' }}
      ></div>
    );
  };

  // Modo Expandido: Painel Flutuante Desacoplado (Floating Palette)
  if (isExpanded && variant === 'floating') {
    // Se houver onClose, é um painel flutuante desacoplado (com header e container)
    if (onClose) {
      return (
        <div 
          className="w-full bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl"
          style={{ 
            WebkitAppRegion: 'no-drag',
          }}
        >
          {/* Header de Arraste e Fechar */}
          <div className="toolbar-drag-handle flex items-center justify-between px-4 py-2 border-b border-white/10 cursor-move hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <GripVertical size={14} />
              <span>Ferramentas de Edição</span>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white hover:bg-red-500/20 rounded transition-colors"
              style={{ WebkitAppRegion: 'no-drag' }}
              title="Fechar painel"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>

          {/* Conteúdo da Toolbar */}
          <div className="p-4 flex flex-wrap gap-2 items-center">
        {/* Grupo: Histórico */}
        {createButton(
          () => editor.chain().focus().undo().run(),
          false,
          <Undo2 size={14} strokeWidth={2.5} />,
          'Desfazer (Ctrl+Z)',
          !editor.can().undo()
        )}
        {createButton(
          () => editor.chain().focus().redo().run(),
          false,
          <Redo2 size={14} strokeWidth={2.5} />,
          'Refazer (Ctrl+Y)',
          !editor.can().redo()
        )}

        <Separator />

        {/* Grupo: Formatação de Texto */}
        {createButton(
          () => editor.chain().focus().toggleBold().run(),
          editor.isActive('bold'),
          <Bold size={14} strokeWidth={2.5} />,
          'Negrito (Ctrl+B)'
        )}
        {createButton(
          () => editor.chain().focus().toggleItalic().run(),
          editor.isActive('italic'),
          <Italic size={14} strokeWidth={2.5} />,
          'Itálico (Ctrl+I)'
        )}
        {createButton(
          () => editor.chain().focus().toggleUnderline().run(),
          editor.isActive('underline'),
          <Underline size={14} strokeWidth={2.5} />,
          'Sublinhado (Ctrl+U)'
        )}
        {createButton(
          () => editor.chain().focus().toggleStrike().run(),
          editor.isActive('strike'),
          <Strikethrough size={14} strokeWidth={2.5} />,
          'Riscado'
        )}
        {createButton(
          () => editor.chain().focus().toggleHighlight().run(),
          editor.isActive('highlight'),
          <Highlighter size={14} strokeWidth={2.5} />,
          'Marca-texto'
        )}

        <Separator />

        {/* Grupo: Títulos */}
        {createButton(
          () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          editor.isActive('heading', { level: 1 }),
          <Heading1 size={14} strokeWidth={2.5} />,
          'Título 1'
        )}
        {createButton(
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          editor.isActive('heading', { level: 2 }),
          <Heading2 size={14} strokeWidth={2.5} />,
          'Título 2'
        )}

        <Separator />

        {/* Grupo: Alinhamento */}
        {createButton(
          () => editor.chain().focus().setTextAlign('left').run(),
          editor.isActive({ textAlign: 'left' }),
          <AlignLeft size={14} strokeWidth={2.5} />,
          'Alinhar à esquerda'
        )}
        {createButton(
          () => editor.chain().focus().setTextAlign('center').run(),
          editor.isActive({ textAlign: 'center' }),
          <AlignCenter size={14} strokeWidth={2.5} />,
          'Centralizar'
        )}
        {createButton(
          () => editor.chain().focus().setTextAlign('right').run(),
          editor.isActive({ textAlign: 'right' }),
          <AlignRight size={14} strokeWidth={2.5} />,
          'Alinhar à direita'
        )}
        {createButton(
          () => editor.chain().focus().setTextAlign('justify').run(),
          editor.isActive({ textAlign: 'justify' }),
          <AlignJustify size={14} strokeWidth={2.5} />,
          'Justificar'
        )}

        <Separator />

        {/* Grupo: Listas e Parágrafo */}
        {createButton(
          () => editor.chain().focus().toggleBulletList().run(),
          editor.isActive('bulletList'),
          <List size={14} strokeWidth={2.5} />,
          'Lista com marcadores'
        )}
        {createButton(
          () => editor.chain().focus().toggleOrderedList().run(),
          editor.isActive('orderedList'),
          <ListOrdered size={14} strokeWidth={2.5} />,
          'Lista numerada'
        )}
        {createButton(
          () => editor.chain().focus().toggleTaskList().run(),
          editor.isActive('taskList'),
          <CheckSquare size={14} strokeWidth={2.5} />,
          'Lista de tarefas'
        )}
        {createButton(
          handleParagraphToggle,
          editor.isActive('paragraph') && !editor.isActive('heading') && !editor.isActive('bulletList') && !editor.isActive('orderedList') && !editor.isActive('taskList') && !editor.isActive('blockquote') && !editor.isActive('codeBlock'),
          <Pilcrow size={14} strokeWidth={2.5} />,
          'Parágrafo (clique novamente para limpar formatações)'
        )}

        <Separator />

        {/* Grupo: Extras */}
        <CodeBlockButton
          editor={editor}
          isActive={editor.isActive('codeBlock')}
          theme={theme}
          createButton={createButton}
        />
        <BlockquoteButton
          editor={editor}
          isActive={editor.isActive('blockquote')}
          theme={theme}
          createButton={createButton}
        />

          <Separator />

          {/* Botão Exportar */}
          <ExportMenu editor={editor} noteTitle={noteTitle} />

          {/* Botão Tema Dark/Light - Apenas no EditorView */}
          {isExpanded && !onClose && onToggleTheme && (
            <>
              <Separator />
              {createButton(
                onToggleTheme,
                false,
                theme === 'dark' ? <Sun size={14} strokeWidth={2.5} /> : <Moon size={14} strokeWidth={2.5} />,
                theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Se não houver onClose, é toolbar fixa no EditorView (sem header, sem container extra)
    return (
      <div 
        className="w-full"
        style={{ 
          WebkitAppRegion: 'no-drag',
        }}
      >
        {/* Conteúdo da Toolbar - Layout limpo e elegante */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Grupo: Histórico */}
          {createButton(
            () => editor.chain().focus().undo().run(),
            false,
            <Undo2 size={14} strokeWidth={2.5} />,
            'Desfazer (Ctrl+Z)',
            !editor.can().undo()
          )}
          {createButton(
            () => editor.chain().focus().redo().run(),
            false,
            <Redo2 size={14} strokeWidth={2.5} />,
            'Refazer (Ctrl+Y)',
            !editor.can().redo()
          )}

          <Separator />

          {/* Grupo: Formatação de Texto */}
          {createButton(
            () => editor.chain().focus().toggleBold().run(),
            editor.isActive('bold'),
            <Bold size={14} strokeWidth={2.5} />,
            'Negrito (Ctrl+B)'
          )}
          {createButton(
            () => editor.chain().focus().toggleItalic().run(),
            editor.isActive('italic'),
            <Italic size={14} strokeWidth={2.5} />,
            'Itálico (Ctrl+I)'
          )}
          {createButton(
            () => editor.chain().focus().toggleUnderline().run(),
            editor.isActive('underline'),
            <Underline size={14} strokeWidth={2.5} />,
            'Sublinhado (Ctrl+U)'
          )}
          {createButton(
            () => editor.chain().focus().toggleStrike().run(),
            editor.isActive('strike'),
            <Strikethrough size={14} strokeWidth={2.5} />,
            'Riscado'
          )}
          {createButton(
            () => editor.chain().focus().toggleHighlight().run(),
            editor.isActive('highlight'),
            <Highlighter size={14} strokeWidth={2.5} />,
            'Marca-texto'
          )}

          <Separator />

          {/* Grupo: Títulos */}
          {createButton(
            () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
            editor.isActive('heading', { level: 1 }),
            <Heading1 size={14} strokeWidth={2.5} />,
            'Título 1'
          )}
          {createButton(
            () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
            editor.isActive('heading', { level: 2 }),
            <Heading2 size={14} strokeWidth={2.5} />,
            'Título 2'
          )}

          <Separator />

          {/* Grupo: Alinhamento */}
          {createButton(
            () => editor.chain().focus().setTextAlign('left').run(),
            editor.isActive({ textAlign: 'left' }),
            <AlignLeft size={14} strokeWidth={2.5} />,
            'Alinhar à esquerda'
          )}
          {createButton(
            () => editor.chain().focus().setTextAlign('center').run(),
            editor.isActive({ textAlign: 'center' }),
            <AlignCenter size={14} strokeWidth={2.5} />,
            'Centralizar'
          )}
          {createButton(
            () => editor.chain().focus().setTextAlign('right').run(),
            editor.isActive({ textAlign: 'right' }),
            <AlignRight size={14} strokeWidth={2.5} />,
            'Alinhar à direita'
          )}
          {createButton(
            () => editor.chain().focus().setTextAlign('justify').run(),
            editor.isActive({ textAlign: 'justify' }),
            <AlignJustify size={14} strokeWidth={2.5} />,
            'Justificar'
          )}

          <Separator />

          {/* Grupo: Listas e Parágrafo */}
          {createButton(
            () => editor.chain().focus().toggleBulletList().run(),
            editor.isActive('bulletList'),
            <List size={14} strokeWidth={2.5} />,
            'Lista com marcadores'
          )}
          {createButton(
            () => editor.chain().focus().toggleOrderedList().run(),
            editor.isActive('orderedList'),
            <ListOrdered size={14} strokeWidth={2.5} />,
            'Lista numerada'
          )}
          {createButton(
            () => editor.chain().focus().toggleTaskList().run(),
            editor.isActive('taskList'),
            <CheckSquare size={14} strokeWidth={2.5} />,
            'Lista de tarefas'
          )}
          {createButton(
            handleParagraphToggle,
            editor.isActive('paragraph') && !editor.isActive('heading') && !editor.isActive('bulletList') && !editor.isActive('orderedList') && !editor.isActive('taskList') && !editor.isActive('blockquote') && !editor.isActive('codeBlock'),
            <Pilcrow size={14} strokeWidth={2.5} />,
            'Parágrafo (clique novamente para limpar formatações)'
          )}

          <Separator />

          {/* Grupo: Extras */}
          <CodeBlockButton
            editor={editor}
            isActive={editor.isActive('codeBlock')}
            theme={theme}
            createButton={createButton}
          />
          <BlockquoteButton
            editor={editor}
            isActive={editor.isActive('blockquote')}
            theme={theme}
            createButton={createButton}
          />

          <Separator />

          {/* Botão Exportar */}
          <ExportMenu editor={editor} noteTitle={noteTitle} />

          {/* Botão Tema Dark/Light - Apenas no EditorView */}
          {isExpanded && !onClose && onToggleTheme && (
            <>
              <Separator />
              {createButton(
                onToggleTheme,
                false,
                theme === 'dark' ? <Sun size={14} strokeWidth={2.5} /> : <Moon size={14} strokeWidth={2.5} />,
                theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Modo Fixed: Toolbar fixa (para TabbedView)
  if (variant === 'fixed') {
    return (
      <div 
        className="w-full bg-neutral-900 border-b border-white/5 px-4 py-2 flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-nowrap justify-start"
        style={{ 
          WebkitAppRegion: 'no-drag',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
      {/* Grupo: Histórico */}
      {createButton(
        () => editor.chain().focus().undo().run(),
        false,
        <Undo2 size={14} strokeWidth={2.5} />,
        'Desfazer (Ctrl+Z)',
        !editor.can().undo()
      )}
      {createButton(
        () => editor.chain().focus().redo().run(),
        false,
        <Redo2 size={14} strokeWidth={2.5} />,
        'Refazer (Ctrl+Y)',
        !editor.can().redo()
      )}

      <Separator />

      {/* Grupo: Formatação de Texto */}
      {createButton(
        () => editor.chain().focus().toggleBold().run(),
        editor.isActive('bold'),
        <Bold size={14} strokeWidth={2.5} />,
        'Negrito (Ctrl+B)'
      )}
      {createButton(
        () => editor.chain().focus().toggleItalic().run(),
        editor.isActive('italic'),
        <Italic size={14} strokeWidth={2.5} />,
        'Itálico (Ctrl+I)'
      )}
      {createButton(
        () => editor.chain().focus().toggleUnderline().run(),
        editor.isActive('underline'),
        <Underline size={14} strokeWidth={2.5} />,
        'Sublinhado (Ctrl+U)'
      )}
      {createButton(
        () => editor.chain().focus().toggleStrike().run(),
        editor.isActive('strike'),
        <Strikethrough size={14} strokeWidth={2.5} />,
        'Riscado'
      )}
      {createButton(
        () => editor.chain().focus().toggleHighlight().run(),
        editor.isActive('highlight'),
        <Highlighter size={14} strokeWidth={2.5} />,
        'Marca-texto'
      )}

      <Separator />

      {/* Grupo: Títulos */}
      {createButton(
        () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        editor.isActive('heading', { level: 1 }),
        <Heading1 size={14} strokeWidth={2.5} />,
        'Título 1'
      )}
      {createButton(
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        editor.isActive('heading', { level: 2 }),
        <Heading2 size={14} strokeWidth={2.5} />,
        'Título 2'
      )}

      <Separator />

      {/* Grupo: Alinhamento */}
      {createButton(
        () => editor.chain().focus().setTextAlign('left').run(),
        editor.isActive({ textAlign: 'left' }),
        <AlignLeft size={14} strokeWidth={2.5} />,
        'Alinhar à esquerda'
      )}
      {createButton(
        () => editor.chain().focus().setTextAlign('center').run(),
        editor.isActive({ textAlign: 'center' }),
        <AlignCenter size={14} strokeWidth={2.5} />,
        'Centralizar'
      )}
      {createButton(
        () => editor.chain().focus().setTextAlign('right').run(),
        editor.isActive({ textAlign: 'right' }),
        <AlignRight size={14} strokeWidth={2.5} />,
        'Alinhar à direita'
      )}
      {createButton(
        () => editor.chain().focus().setTextAlign('justify').run(),
        editor.isActive({ textAlign: 'justify' }),
        <AlignJustify size={14} strokeWidth={2.5} />,
        'Justificar'
      )}

      <Separator />

      {/* Grupo: Listas e Parágrafo */}
      {createButton(
        () => editor.chain().focus().toggleBulletList().run(),
        editor.isActive('bulletList'),
        <List size={14} strokeWidth={2.5} />,
        'Lista com marcadores'
      )}
      {createButton(
        () => editor.chain().focus().toggleOrderedList().run(),
        editor.isActive('orderedList'),
        <ListOrdered size={14} strokeWidth={2.5} />,
        'Lista numerada'
      )}
      {createButton(
        () => editor.chain().focus().toggleTaskList().run(),
        editor.isActive('taskList'),
        <CheckSquare size={14} strokeWidth={2.5} />,
        'Lista de tarefas'
      )}
      {createButton(
        handleParagraphToggle,
        editor.isActive('paragraph') && !editor.isActive('heading') && !editor.isActive('bulletList') && !editor.isActive('orderedList') && !editor.isActive('taskList') && !editor.isActive('blockquote') && !editor.isActive('codeBlock'),
        <Pilcrow size={14} strokeWidth={2.5} />,
        'Parágrafo (clique novamente para limpar formatações)'
      )}

      <Separator />

      {/* Grupo: Extras */}
      {createButton(
        () => editor.chain().focus().toggleCodeBlock().run(),
        editor.isActive('codeBlock'),
        <Code size={14} strokeWidth={2.5} />,
        'Bloco de código'
      )}
      <BlockquoteButton
        editor={editor}
        isActive={editor.isActive('blockquote')}
        theme={theme}
        createButton={createButton}
      />

      <Separator />

      {/* Botão Exportar */}
      <ExportMenu editor={editor} noteTitle={noteTitle} />
    </div>
    );
  }

  // Modo Normal (Floating): Scroll horizontal
  return (
    <div 
      className="flex items-center gap-0.5 bg-neutral-800/60 backdrop-blur-sm rounded-lg p-1 border border-white/5 overflow-x-auto scrollbar-hide flex-nowrap"
      style={{ 
        WebkitAppRegion: 'no-drag',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      {/* Grupo: Histórico */}
      {createButton(
        () => editor.chain().focus().undo().run(),
        false,
        <Undo2 size={14} strokeWidth={2.5} />,
        'Desfazer (Ctrl+Z)',
        !editor.can().undo()
      )}
      {createButton(
        () => editor.chain().focus().redo().run(),
        false,
        <Redo2 size={14} strokeWidth={2.5} />,
        'Refazer (Ctrl+Y)',
        !editor.can().redo()
      )}

      <Separator />

      {/* Grupo: Formatação de Texto */}
      {createButton(
        () => editor.chain().focus().toggleBold().run(),
        editor.isActive('bold'),
        <Bold size={14} strokeWidth={2.5} />,
        'Negrito (Ctrl+B)'
      )}
      {createButton(
        () => editor.chain().focus().toggleItalic().run(),
        editor.isActive('italic'),
        <Italic size={14} strokeWidth={2.5} />,
        'Itálico (Ctrl+I)'
      )}
      {createButton(
        () => editor.chain().focus().toggleUnderline().run(),
        editor.isActive('underline'),
        <Underline size={14} strokeWidth={2.5} />,
        'Sublinhado (Ctrl+U)'
      )}
      {createButton(
        () => editor.chain().focus().toggleStrike().run(),
        editor.isActive('strike'),
        <Strikethrough size={14} strokeWidth={2.5} />,
        'Riscado'
      )}
      {createButton(
        () => editor.chain().focus().toggleHighlight().run(),
        editor.isActive('highlight'),
        <Highlighter size={14} strokeWidth={2.5} />,
        'Marca-texto'
      )}

      <Separator />

      {/* Grupo: Títulos */}
      {createButton(
        () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        editor.isActive('heading', { level: 1 }),
        <Heading1 size={14} strokeWidth={2.5} />,
        'Título 1'
      )}
      {createButton(
        () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        editor.isActive('heading', { level: 2 }),
        <Heading2 size={14} strokeWidth={2.5} />,
        'Título 2'
      )}

      <Separator />

      {/* Grupo: Alinhamento */}
      {createButton(
        () => editor.chain().focus().setTextAlign('left').run(),
        editor.isActive({ textAlign: 'left' }),
        <AlignLeft size={14} strokeWidth={2.5} />,
        'Alinhar à esquerda'
      )}
      {createButton(
        () => editor.chain().focus().setTextAlign('center').run(),
        editor.isActive({ textAlign: 'center' }),
        <AlignCenter size={14} strokeWidth={2.5} />,
        'Centralizar'
      )}
      {createButton(
        () => editor.chain().focus().setTextAlign('right').run(),
        editor.isActive({ textAlign: 'right' }),
        <AlignRight size={14} strokeWidth={2.5} />,
        'Alinhar à direita'
      )}
      {createButton(
        () => editor.chain().focus().setTextAlign('justify').run(),
        editor.isActive({ textAlign: 'justify' }),
        <AlignJustify size={14} strokeWidth={2.5} />,
        'Justificar'
      )}

      <Separator />

      {/* Grupo: Listas e Parágrafo */}
      {createButton(
        () => editor.chain().focus().toggleBulletList().run(),
        editor.isActive('bulletList'),
        <List size={14} strokeWidth={2.5} />,
        'Lista com marcadores'
      )}
      {createButton(
        () => editor.chain().focus().toggleOrderedList().run(),
        editor.isActive('orderedList'),
        <ListOrdered size={14} strokeWidth={2.5} />,
        'Lista numerada'
      )}
      {createButton(
        () => editor.chain().focus().toggleTaskList().run(),
        editor.isActive('taskList'),
        <CheckSquare size={14} strokeWidth={2.5} />,
        'Lista de tarefas'
      )}
      {createButton(
        handleParagraphToggle,
        editor.isActive('paragraph') && !editor.isActive('heading') && !editor.isActive('bulletList') && !editor.isActive('orderedList') && !editor.isActive('taskList') && !editor.isActive('blockquote') && !editor.isActive('codeBlock'),
        <Pilcrow size={14} strokeWidth={2.5} />,
        'Parágrafo (clique novamente para limpar formatações)'
      )}

      <Separator />

      {/* Grupo: Extras */}
      {createButton(
        () => editor.chain().focus().toggleCodeBlock().run(),
        editor.isActive('codeBlock'),
        <Code size={14} strokeWidth={2.5} />,
        'Bloco de código'
      )}
      <BlockquoteButton
        editor={editor}
        isActive={editor.isActive('blockquote')}
        theme={theme}
        createButton={createButton}
      />

      <Separator />

      {/* Botão Exportar */}
      <ExportMenu editor={editor} noteTitle={noteTitle} />
    </div>
  );
};

export default EditorToolbar;
