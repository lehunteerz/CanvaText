import { useEffect, useRef } from 'react';

/**
 * Hook para manter os temas dos code blocks aplicados mesmo quando o Tiptap recria o DOM
 */
export const useCodeBlockThemeObserver = (editor) => {
  const observerRef = useRef(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!editor) return;

    const themeDefinitions = {
      'code-theme-horizon': { bg: '#1C1E26', text: '#CBCED0' },
      'code-theme-nord': { bg: '#2E3440', text: '#D8DEE9' },
      'code-theme-dracula': { bg: '#282A36', text: '#F8F8F2' },
      'code-theme-onedark': { bg: '#282C34', text: '#ABB2BF' },
    };

    const applyCodeBlockThemes = () => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      requestAnimationFrame(() => {
        try {
          const codeBlockElements = document.querySelectorAll('.tiptap pre');
          
          codeBlockElements.forEach((preElement) => {
            let theme = preElement.getAttribute('data-code-theme');
            
            // Se não tem tema no atributo, buscar na classe
            if (!theme) {
              const themeClass = Array.from(preElement.classList).find(c => c.startsWith('code-theme-'));
              if (themeClass) {
                theme = themeClass;
              }
            }
            
            // Se ainda não tem tema, buscar no estado do editor
            if (!theme) {
              try {
                editor.state.doc.descendants((node, pos) => {
                  if (node.type.name === 'codeBlock' && node.attrs.theme) {
                    const domNode = editor.view.nodeDOM(pos);
                    if (domNode === preElement) {
                      theme = node.attrs.theme;
                      return false; // Parar busca
                    }
                  }
                });
              } catch (e) {
                // Ignorar erros
              }
            }
            
            // Aplicar tema se temos
            if (theme) {
              const themeDef = themeDefinitions[theme];
              
              if (themeDef) {
                // Remover classes de tema anteriores (mas manter code-with-lines)
                const classesToRemove = Array.from(preElement.classList).filter(c => 
                  c.startsWith('code-theme-') && c !== theme && c !== 'code-with-lines'
                );
                preElement.classList.remove(...classesToRemove);
                
                // Adicionar classe CSS do tema
                if (!preElement.classList.contains(theme)) {
                  preElement.classList.add(theme);
                }
                preElement.setAttribute('data-code-theme', theme);
                
                // Aplicar estilos inline FORÇADOS no <pre>
                preElement.style.setProperty('background-color', themeDef.bg, 'important');
                preElement.style.setProperty('color', themeDef.text, 'important');
                
                // Aplicar também no elemento <code> dentro do <pre>
                const codeChild = preElement.querySelector('code');
                if (codeChild) {
                  codeChild.style.setProperty('background-color', 'transparent', 'important');
                  codeChild.style.setProperty('color', themeDef.text, 'important');
                }
              }
            }
          });
        } catch (error) {
          console.error('Error applying code block themes:', error);
        } finally {
          isProcessingRef.current = false;
        }
      });
    };

    // Observer para detectar quando code blocks são adicionados/modificados
    const observer = new MutationObserver((mutations) => {
      let shouldApply = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              if (node.tagName === 'PRE' || node.querySelector('pre')) {
                shouldApply = true;
              }
            }
          });
        }
        
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target.tagName === 'PRE') {
            const hasTheme = target.getAttribute('data-code-theme') || 
                           Array.from(target.classList).some(c => c.startsWith('code-theme-'));
            if (hasTheme) {
              shouldApply = true;
            }
          }
        }
      });
      
      if (shouldApply && !isProcessingRef.current) {
        setTimeout(applyCodeBlockThemes, 10);
      }
    });

    // Buscar elemento tiptap de forma mais robusta
    const findTiptapElement = () => {
      // Tentar múltiplos seletores
      return document.querySelector('.tiptap') || 
             document.querySelector('[class*="tiptap"]') ||
             editor.view?.dom?.closest('.tiptap') ||
             editor.view?.dom;
    };
    
    const tiptapElement = findTiptapElement();
    if (tiptapElement) {
      observer.observe(tiptapElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-code-theme', 'class'],
      });
      
      // Também escutar eventos customizados
      tiptapElement.addEventListener('tiptap-update', applyCodeBlockThemes);
    } else {
      // Se não encontrou, tentar novamente após um delay
      setTimeout(() => {
        const retryElement = findTiptapElement();
        if (retryElement) {
          observer.observe(retryElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-code-theme', 'class'],
          });
          retryElement.addEventListener('tiptap-update', applyCodeBlockThemes);
        }
      }, 100);
    }

    // Aplicar temas quando o editor atualizar
    const handleUpdate = () => {
      setTimeout(applyCodeBlockThemes, 10);
      setTimeout(applyCodeBlockThemes, 50);
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);
    editor.on('create', handleUpdate);

    // Aplicar temas inicialmente
    setTimeout(applyCodeBlockThemes, 50);
    setTimeout(applyCodeBlockThemes, 150);
    setTimeout(applyCodeBlockThemes, 300);

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      const tiptapElement = document.querySelector('.tiptap') || editor.view?.dom;
      if (tiptapElement) {
        tiptapElement.removeEventListener('tiptap-update', applyCodeBlockThemes);
      }
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
      editor.off('create', handleUpdate);
    };
  }, [editor]);
};
