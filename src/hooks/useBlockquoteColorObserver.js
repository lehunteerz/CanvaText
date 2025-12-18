import { useEffect, useRef } from 'react';

/**
 * Hook para manter as cores dos blockquotes aplicadas mesmo quando o Tiptap recria o DOM
 */
export const useBlockquoteColorObserver = (editor) => {
  const observerRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    const applyBlockquoteColors = () => {
      const blockquoteElements = document.querySelectorAll('.tiptap blockquote');
      blockquoteElements.forEach((blockquoteElement) => {
        // Verificar atributos data primeiro
        let color = blockquoteElement.getAttribute('data-color');
        let borderColor = blockquoteElement.getAttribute('data-border-color');
        
        // Se não tem atributos, buscar no estado do editor
        if (!color || !borderColor) {
          try {
            // Buscar todos os blockquotes no documento
            editor.state.doc.descendants((node, pos) => {
              if (node.type.name === 'blockquote' && node.attrs.color && node.attrs.borderColor) {
                const domNode = editor.view.nodeDOM(pos);
                if (domNode === blockquoteElement) {
                  color = node.attrs.color;
                  borderColor = node.attrs.borderColor;
                  return false; // Parar busca
                }
              }
            });
          } catch (e) {
            // Ignorar erros
          }
        }
        
        // Aplicar classe CSS e atributos se temos as cores
        if (color && borderColor) {
          // Remover classes de cor anteriores
          blockquoteElement.classList.remove(...Array.from(blockquoteElement.classList).filter(c => c.startsWith('blockquote-color-')));
          
          // Adicionar classe CSS baseada na cor
          const colorClass = `blockquote-color-${color.replace('#', '')}`;
          blockquoteElement.classList.add(colorClass);
          
          // Garantir atributos estão presentes
          blockquoteElement.setAttribute('data-color', color);
          blockquoteElement.setAttribute('data-border-color', borderColor);
        }
      });
    };

    // Observer para detectar quando blockquotes são adicionados/modificados
    const observer = new MutationObserver((mutations) => {
      let shouldApply = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              if (node.tagName === 'BLOCKQUOTE' || node.querySelector('blockquote')) {
                shouldApply = true;
              }
            }
          });
        }
        
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target.tagName === 'BLOCKQUOTE') {
            // Se os atributos de cor foram removidos ou modificados, reaplicar
            const hasColor = target.getAttribute('data-color');
            const hasBorderColor = target.getAttribute('data-border-color');
            if (hasColor && hasBorderColor) {
              // Verificar se os estilos estão aplicados corretamente
              const currentBorderColor = target.style.borderLeftColor;
              const expectedBorderColor = hasBorderColor;
              // Se não tem estilo ou está diferente, reaplicar
              if (!currentBorderColor || currentBorderColor !== expectedBorderColor) {
                shouldApply = true;
              }
            } else if (hasColor || hasBorderColor) {
              shouldApply = true;
            }
          }
        }
      });
      
      if (shouldApply) {
        // Usar requestAnimationFrame para aplicar após o DOM ser atualizado
        requestAnimationFrame(() => {
          applyBlockquoteColors();
        });
      }
    });

    const tiptapElement = document.querySelector('.tiptap');
    if (tiptapElement) {
      observer.observe(tiptapElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-color', 'data-border-color', 'style'],
      });
    }

    // Aplicar cores quando o editor atualizar
    const handleUpdate = () => {
      requestAnimationFrame(() => {
        applyBlockquoteColors();
        // Aplicar novamente após um pequeno delay para garantir
        setTimeout(applyBlockquoteColors, 10);
      });
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);
    editor.on('create', handleUpdate);

    // Aplicar cores inicialmente após múltiplos delays
    setTimeout(applyBlockquoteColors, 50);
    setTimeout(applyBlockquoteColors, 150);
    setTimeout(applyBlockquoteColors, 300);

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
      editor.off('create', handleUpdate);
    };
  }, [editor]);
};

