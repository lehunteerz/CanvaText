import { useEffect, useRef } from 'react';
import { autoSaveNote, exportNoteUniversal } from '../utils/exportUtils';
import { useToastContext } from '../contexts/ToastContext';

// Hook para gerenciar atalhos de salvamento (Ctrl+S, Shift+S e Ctrl+Shift+S)
export const useExportShortcut = (editor, noteTitle = 'nota', enabled = true) => {
  const toast = useToastContext();
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !editor) return;

    const handleKeyDown = async (e) => {
      // Prevenir múltiplas chamadas simultâneas
      if (isProcessingRef.current) {
        return;
      }

      const key = e.key.toUpperCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      
      // Detectar Ctrl+S (Salvar automaticamente na pasta Documentos\CanvaText saved)
      const isCtrlS = ctrl && !shift && key === 'S';
      
      // Detectar Shift+S (Auto-Save - Backup automático)
      const isShiftS = shift && !ctrl && key === 'S';
      
      // Detectar Ctrl+Shift+S (Manual Save - Exportar com dialog)
      const isCtrlShiftS = ctrl && shift && key === 'S';

      if (isCtrlS || isShiftS || isCtrlShiftS) {
        e.preventDefault();
        e.stopPropagation();
        
        // Marcar como processando
        isProcessingRef.current = true;

        try {
          if (isCtrlS) {
            // Mostrar toast de loading
            const loadingToast = toast.loading('Salvando...');
            
            // Ctrl+S: Salvar automaticamente na pasta Documentos\CanvaText saved (sem dialog)
            const result = await autoSaveNote(editor, noteTitle);
            
            // Remover toast de loading
            loadingToast();
            
            if (result && result.success) {
              const fileName = result.filePath?.split(/[/\\]/).pop() || 'arquivo';
              toast.success(`Salvo: ${fileName}`, 3000);
            } else if (result && result.error && result.error !== 'Salvamento já em andamento') {
              toast.error(`Erro ao salvar: ${result.error || 'Erro desconhecido'}`, 4000);
            }
          } else if (isShiftS) {
            // Mostrar toast de loading
            const loadingToast = toast.loading('Fazendo backup...');
            
            // Auto-Save: Backup automático sem dialog
            const result = await autoSaveNote(editor, noteTitle);
            
            // Remover toast de loading
            loadingToast();
            
            if (result && result.success) {
              const fileName = result.filePath?.split(/[/\\]/).pop() || 'arquivo';
              toast.success(`Backup salvo: ${fileName}`, 3000);
            } else if (result && result.error && result.error !== 'Salvamento já em andamento') {
              toast.error(`Erro no backup: ${result.error || 'Erro desconhecido'}`, 4000);
            }
          } else if (isCtrlShiftS) {
            // Mostrar toast de loading
            const loadingToast = toast.loading('Exportando...');
            
            // Manual Save: Exportar com menu universal (envia todos os conteúdos)
            const result = await exportNoteUniversal(editor, noteTitle);
            
            // Remover toast de loading
            loadingToast();
            
            if (result && result.success) {
              const fileName = result.filePath?.split(/[/\\]/).pop() || 'arquivo';
              toast.success(`Exportado: ${fileName}`, 3000);
            } else if (result && !result.canceled && result.error && result.error !== 'Exportação já em andamento') {
              toast.error(`Erro ao exportar: ${result.error || 'Erro desconhecido'}`, 4000);
            }
            // Se foi cancelado, não mostra nada
          }
        } catch (error) {
          console.error('Erro ao processar atalho de salvamento:', error);
          toast.error('Erro inesperado ao salvar', 4000);
        } finally {
          // Liberar flag após um pequeno delay para evitar chamadas muito rápidas
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 500);
        }
      }
    };

    // Remover modo de captura para evitar conflitos com lógica de foco da janela
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, noteTitle, enabled, toast]);
};
