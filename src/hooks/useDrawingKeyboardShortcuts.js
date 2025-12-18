import { useEffect } from 'react';
import { useDrawing } from '../contexts/DrawingContext';

/**
 * Hook para gerenciar atalhos de teclado do sistema de desenho
 */
export const useDrawingKeyboardShortcuts = () => {
  const {
    selectedElementId,
    selectedElementIds,
    deleteElement,
    deleteElements,
    cloneElement,
    cloneElements,
    selectAllElements,
    clearSelection,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useDrawing();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Não processar se estiver digitando em um input/textarea
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Delete/Backspace - Deletar elemento(s) selecionado(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementIds.length > 1) {
          e.preventDefault();
          deleteElements(selectedElementIds);
        } else if (selectedElementId) {
          e.preventDefault();
          deleteElement(selectedElementId);
        }
        return;
      }

      // Esc - Limpar seleção
      if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
        return;
      }

      // Ctrl+A / Cmd+A - Selecionar todos
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAllElements();
        return;
      }

      // Ctrl+D / Cmd+D - Duplicar elemento(s)
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedElementIds.length > 1) {
          cloneElements(selectedElementIds);
        } else if (selectedElementId) {
          cloneElement(selectedElementId);
        }
        return;
      }

      // Ctrl+Z / Cmd+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
        return;
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z ou Ctrl+Y / Cmd+Y - Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    selectedElementId,
    selectedElementIds,
    deleteElement,
    deleteElements,
    cloneElement,
    cloneElements,
    selectAllElements,
    clearSelection,
    undo,
    redo,
    canUndo,
    canRedo,
  ]);
};

