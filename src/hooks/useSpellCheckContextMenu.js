import { useState, useEffect, useCallback } from 'react';
import { pluginManager } from '../plugins/core/PluginManager';

/**
 * Hook para menu de contexto de correção ortográfica
 * Detecta clique direito em palavras e mostra sugestões
 */
export const useSpellCheckContextMenu = (editor) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  // Verificar ortografia de uma palavra específica
  const checkWord = useCallback(async (word, position) => {
    if (!editor || !word || word.trim().length < 2) {
      return null;
    }

    setIsChecking(true);
    try {
      // Usar LanguageTool API para verificar a palavra
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: word,
          language: 'pt-BR',
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const matches = data.matches || [];

      // Se houver erros, retornar sugestões
      if (matches.length > 0 && matches[0].replacements) {
        const suggestions = matches[0].replacements
          .slice(0, 5)
          .map(r => r.value)
          .filter(s => s !== word); // Remover a própria palavra

        if (suggestions.length > 0) {
          return {
            word,
            suggestions,
            error: matches[0],
            position,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao verificar palavra:', error);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, [editor]);

  // Obter palavra na posição do cursor ou seleção
  const getWordAtPosition = useCallback((editor, pos) => {
    if (!editor) return null;

    const { state } = editor;
    const { selection } = state;
    
    // Se houver seleção, usar a seleção
    if (!selection.empty) {
      const text = state.doc.textBetween(selection.from, selection.to);
      const word = text.trim().replace(/[^\w\u00C0-\u017F]/g, '');
      if (word.length >= 2) {
        return { word, from: selection.from, to: selection.to };
      }
      return null;
    }

    // Obter posição no documento
    const docPos = pos || selection.$from.pos;
    const $pos = state.doc.resolve(docPos);
    
    // Obter texto do parágrafo atual
    const paragraphStart = $pos.start($pos.depth);
    const paragraphEnd = $pos.end($pos.depth);
    const paragraphText = state.doc.textBetween(paragraphStart, paragraphEnd);
    
    // Calcular posição relativa no parágrafo
    const relativePos = docPos - paragraphStart;
    
    // Encontrar palavra na posição
    // Regex para encontrar palavras (incluindo acentos)
    const wordRegex = /[\w\u00C0-\u017F]+/g;
    let match;
    
    while ((match = wordRegex.exec(paragraphText)) !== null) {
      const wordStart = match.index;
      const wordEnd = wordStart + match[0].length;
      
      if (relativePos >= wordStart && relativePos <= wordEnd) {
        return {
          word: match[0],
          from: paragraphStart + wordStart,
          to: paragraphStart + wordEnd,
        };
      }
    }

    return null;
  }, []);

  // Handler para clique direito
  const handleContextMenu = useCallback(async (e) => {
    if (!editor) return;

    e.preventDefault();

    // Obter posição do clique no editor
    const editorElement = editor.view.dom;
    const rect = editorElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Converter coordenadas para posição no documento
    const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
    if (!pos) return;

    // Obter palavra na posição
    const wordInfo = getWordAtPosition(editor, pos.pos);
    if (!wordInfo || !wordInfo.word) return;

    // Verificar ortografia
    const result = await checkWord(wordInfo.word, { x: e.clientX, y: e.clientY });
    
    if (result) {
      setContextMenu({
        ...result,
        wordInfo,
      });
    } else {
      setContextMenu(null);
    }
  }, [editor, checkWord, getWordAtPosition]);

  // Aplicar correção
  const applyCorrection = useCallback((suggestion) => {
    if (!editor || !contextMenu) return;

    const { wordInfo } = contextMenu;
    
    // Substituir palavra no editor
    editor
      .chain()
      .focus()
      .setTextSelection({ from: wordInfo.from, to: wordInfo.to })
      .insertContent(suggestion)
      .run();

    setContextMenu(null);
  }, [editor, contextMenu]);

  // Fechar menu
  const closeMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Adicionar listener de contexto
  useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;
    editorElement.addEventListener('contextmenu', handleContextMenu);

    return () => {
      editorElement.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [editor, handleContextMenu]);

  // Fechar menu ao clicar fora
  useEffect(() => {
    if (!contextMenu) return;

    const handleClick = () => {
      setContextMenu(null);
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [contextMenu]);

  return {
    contextMenu,
    isChecking,
    applyCorrection,
    closeMenu,
  };
};

