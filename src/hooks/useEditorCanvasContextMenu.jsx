import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Trash2,
  Save,
  HardDrive,
  Copy,
  ClipboardPaste,
  AlignJustify,
  FolderOpen,
} from 'lucide-react';
import { exportNoteUniversal, autoSaveNote } from '../utils/exportUtils';
import { downloadEditorHtmlFile } from '../utils/browserSave';
import { openFile } from '../utils/openFileUtils';

/**
 * Menu de contexto na área do editor de texto (botão direito).
 */
export function useEditorCanvasContextMenu({ editor, theme = 'dark', toast, enabled }) {
  const [menu, setMenu] = useState(null);
  const menuRef = useRef(null);
  const isLight = theme === 'light';

  const close = useCallback(() => setMenu(null), []);

  useEffect(() => {
    if (!menu) return;
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) close();
    };
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDoc, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu, close]);

  const onEditorAreaContextMenu = useCallback(
    (e) => {
      if (!enabled || !editor) return;
      const t = e.target;
      if (t.closest('[data-drawing-canvas]')) return;
      if (t.closest('button, a, [role="menu"]')) return;
      if (!t.closest('#editor-scroll-container') && !t.closest('.tiptap-wrapper')) return;
      e.preventDefault();

      const approxW = 228;
      const approxH = 320;
      let x = e.clientX;
      let y = e.clientY;
      if (x + approxW > window.innerWidth) x = Math.max(8, window.innerWidth - approxW - 8);
      if (y + approxH > window.innerHeight) y = Math.max(8, window.innerHeight - approxH - 8);

      setMenu({ x, y });
    },
    [enabled, editor]
  );

  const run = async (action) => {
    if (!editor) return;
    close();

    try {
      switch (action) {
        case 'clear': {
          if (
            !window.confirm(
              'Limpar todo o documento? Esta ação não pode ser desfeita pelo menu.'
            )
          )
            return;
          editor.commands.clearContent();
          toast?.success?.('Documento limpo');
          break;
        }
        case 'save': {
          if (window.electronAPI) {
            const r = await exportNoteUniversal(editor, 'nota-editor');
            if (r.success) toast?.success?.('Ficheiro guardado');
            else if (!r.canceled && r.error) toast?.error?.(r.error);
          } else {
            downloadEditorHtmlFile(editor.getHTML());
            toast?.success?.('Download HTML iniciado');
          }
          break;
        }
        case 'backup': {
          if (!window.electronAPI) {
            toast?.info?.('Backup automático disponível na app Electron');
            return;
          }
          const r = await autoSaveNote(editor, 'editor-backup');
          if (r.success) toast?.success?.('Backup guardado');
          else toast?.error?.(r.error || 'Falha no backup');
          break;
        }
        case 'copyHtml': {
          await navigator.clipboard.writeText(editor.getHTML());
          toast?.success?.('HTML copiado');
          break;
        }
        case 'paste': {
          const text = await navigator.clipboard.readText();
          editor.chain().focus().insertContent(text).run();
          toast?.success?.('Colado');
          break;
        }
        case 'selectAll': {
          editor.chain().focus().selectAll().run();
          break;
        }
        case 'open': {
          if (!window.electronAPI) {
            toast?.info?.('Abrir ficheiro: use a app Electron');
            return;
          }
          const r = await openFile();
          if (r.canceled) return;
          if (r.success && r.content) {
            editor.commands.setContent(r.content);
            toast?.success?.(`Aberto: ${r.fileName || 'ficheiro'}`);
          } else toast?.error?.(r.error || 'Não foi possível abrir');
          break;
        }
        default:
          break;
      }
    } catch (err) {
      toast?.error?.(err.message || 'Erro');
    }
  };

  const Item = ({ icon: Icon, label, onClick, danger }) => (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center gap-2 px-3 py-2 text-left text-sm rounded-md transition-colors
        ${
          danger
            ? isLight
              ? 'text-red-700 hover:bg-red-50'
              : 'text-red-400 hover:bg-red-950/40'
            : isLight
              ? 'text-neutral-800 hover:bg-neutral-100'
              : 'text-neutral-200 hover:bg-white/10'
        }
      `}
    >
      <Icon size={16} className="flex-shrink-0 opacity-80" />
      {label}
    </button>
  );

  const contextMenuUI = menu ? (
    <div
      ref={menuRef}
      role="menu"
      className={`
            fixed z-[200] min-w-[220px] py-1 px-1 rounded-lg shadow-2xl border
            ${isLight ? 'bg-white border-neutral-200' : 'bg-neutral-900 border-white/15'}
          `}
      style={{ left: menu.x, top: menu.y }}
    >
      <Item
        icon={Trash2}
        label="Limpar documento (refazer do zero)"
        danger
        onClick={() => run('clear')}
      />
      <Item icon={Save} label="Guardar como…" onClick={() => run('save')} />
      <Item
        icon={HardDrive}
        label="Backup rápido (pasta Documentos)"
        onClick={() => run('backup')}
      />
      <Item icon={FolderOpen} label="Abrir ficheiro…" onClick={() => run('open')} />
      <div className={`my-1 h-px ${isLight ? 'bg-neutral-200' : 'bg-white/10'}`} />
      <Item
        icon={AlignJustify}
        label="Selecionar tudo"
        onClick={() => run('selectAll')}
      />
      <Item icon={Copy} label="Copiar HTML" onClick={() => run('copyHtml')} />
      <Item icon={ClipboardPaste} label="Colar texto" onClick={() => run('paste')} />
    </div>
  ) : null;

  return { onEditorAreaContextMenu, contextMenuUI };
}
