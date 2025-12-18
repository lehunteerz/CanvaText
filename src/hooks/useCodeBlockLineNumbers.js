import { useEffect, useRef } from 'react';

export const useCodeBlockLineNumbers = (editor) => {
  const timeoutRef = useRef(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!editor) return;

    const addLineNumbers = () => {
      // Evitar execuções simultâneas
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      try {
        // Buscar todos os code blocks, mesmo os que já têm tema aplicado
        const codeBlocks = document.querySelectorAll('.tiptap pre:not(.code-with-lines)');
        codeBlocks.forEach((pre) => {
          const code = pre.querySelector('code');
          if (!code) return;

          // Contar linhas
          const text = code.textContent || '';
          const lines = text.split('\n');
          const actualLines = lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines;
          const lineCount = Math.max(1, actualLines.length);
          
          // Gerar números de linha
          const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

          // Usar requestAnimationFrame para evitar conflitos com o editor
          requestAnimationFrame(() => {
            pre.classList.add('code-with-lines');
            pre.setAttribute('data-lines', lineNumbers);
          });
        });
      } finally {
        isProcessingRef.current = false;
      }
    };

    // Debounce para evitar execuções excessivas
    const debouncedAddLineNumbers = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        addLineNumbers();
      }, 150);
    };

    // Adicionar números quando o editor atualizar (apenas em mudanças de conteúdo)
    const handleUpdate = ({ editor }) => {
      // Verificar se há code blocks no conteúdo
      const hasCodeBlocks = editor.state.doc.descendants((node) => {
        return node.type.name === 'codeBlock';
      });
      
      if (hasCodeBlocks) {
        debouncedAddLineNumbers();
      }
    };

    editor.on('update', handleUpdate);

    // Adicionar números inicialmente após um delay
    const initialTimeout = setTimeout(() => {
      addLineNumbers();
    }, 300);

    return () => {
      clearTimeout(initialTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      editor.off('update', handleUpdate);
      isProcessingRef.current = false;
    };
  }, [editor]);
};

