import { createContext, useContext, useState, useCallback } from 'react';
import { getDefaultFramePreset } from '../constants/framePresets';

const DrawingContext = createContext(null);

export const useDrawing = () => {
  const context = useContext(DrawingContext);
  if (!context) {
    throw new Error('useDrawing must be used within DrawingProvider');
  }
  return context;
};

export const DrawingProvider = ({ children }) => {
  const [selectedTool, setSelectedTool] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [selectedElementIds, setSelectedElementIds] = useState([]); // Multi-seleção
  const [activeFrameId, setActiveFrameId] = useState(null);
  const [drawingMode, setDrawingMode] = useState(false); // Modo desenho ativo
  
  // Histórico para Undo/Redo
  const [history, setHistory] = useState([[]]); // Array de estados de elementos
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Estilo padrão para novos elementos
  const [defaultStyle, setDefaultStyle] = useState({
    stroke: '#000000',      // Cor do contorno
    fill: 'transparent',    // Cor do fundo
    strokeWidth: 2,        // Espessura (1, 2, 3)
    opacity: 100,          // Opacidade (0-100)
  });

  /** Quadro: preset Figma-like e modo colocação */
  const [selectedFramePreset, setSelectedFramePreset] = useState(getDefaultFramePreset);
  const [framePlacementMode, setFramePlacementMode] = useState('preset'); // 'preset' | 'free'

  /** Lápis: suavização ao soltar ('mild' | 'normal' | 'strong') */
  const [pencilSmoothLevel, setPencilSmoothLevel] = useState('normal');
  
  // Clipboard para copiar/colar elementos e estilos
  const [clipboard, setClipboard] = useState({
    type: null,            // 'element' | 'elements' | 'styles'
    data: null,
  });
  
  // Elementos bloqueados (não podem ser movidos/editados)
  const [lockedElements, setLockedElements] = useState([]);

  // Salvar estado no histórico antes de mudanças
  const saveToHistory = useCallback((newElements) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newElements))); // Deep clone
      const limited = newHistory.slice(-50); // Limitar a 50 estados
      setHistoryIndex(limited.length - 1);
      return limited;
    });
  }, [historyIndex]);

  const addElement = (element) => {
    setElements(prev => {
      // Garantir que o elemento tenha zIndex, locked e link
      const newElement = {
        ...element,
        zIndex: element.zIndex ?? prev.length, // zIndex padrão baseado na ordem
        locked: element.locked ?? false,
        link: element.link ?? null,
        style: {
          ...defaultStyle,
          ...element.style, // Estilo do elemento sobrescreve o padrão
        },
      };
      const newElements = [...prev, newElement];
      saveToHistory(newElements);
      return newElements;
    });
  };

  const updateElement = (id, updates, skipHistory = false) => {
    setElements(prev => {
      const newElements = prev.map(el => 
        el.id === id ? { ...el, ...updates } : el
      );
      // Não salvar no histórico se for apenas arrastar (para evitar histórico muito granular)
      if (!skipHistory) {
        saveToHistory(newElements);
      }
      return newElements;
    });
  };

  const updateFrameTitle = (id, title) => {
    updateElement(id, { title });
  };

  const deleteElement = (id) => {
    setElements(prev => {
      const newElements = prev.filter(el => el.id !== id && el.frameId !== id);
      saveToHistory(newElements);
      return newElements;
    });
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
    setSelectedElementIds(prev => prev.filter(elId => elId !== id));
  };

  const deleteElements = (ids) => {
    setElements(prev => {
      const newElements = prev.filter(el => 
        !ids.includes(el.id) && !ids.includes(el.frameId)
      );
      saveToHistory(newElements);
      return newElements;
    });
    setSelectedElementIds([]);
    setSelectedElementId(null);
  };

  const cloneElement = (id) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const cloned = {
        ...element,
        id: `element-${Date.now()}`,
        x: element.x + 20,
        y: element.y + 20,
      };
      addElement(cloned);
      setSelectedElementId(cloned.id);
    }
  };

  const cloneElements = (ids) => {
    const elementsToClone = elements.filter(el => ids.includes(el.id));
    const clonedElements = elementsToClone.map((el, index) => ({
      ...el,
      id: `element-${Date.now()}-${index}`,
      x: el.x + 20,
      y: el.y + 20,
    }));
    setElements(prev => {
      const newElements = [...prev, ...clonedElements];
      saveToHistory(newElements);
      return newElements;
    });
    setSelectedElementIds(clonedElements.map(el => el.id));
  };

  const getSelectedElement = () => {
    return elements.find(el => el.id === selectedElementId);
  };

  const getElementsInFrame = (frameId) => {
    return elements.filter(el => el.frameId === frameId);
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements([...history[newIndex]]);
      setSelectedElementId(null);
      setSelectedElementIds([]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements([...history[newIndex]]);
      setSelectedElementId(null);
      setSelectedElementIds([]);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Seleção múltipla
  const toggleElementSelection = (id) => {
    setSelectedElementIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(elId => elId !== id);
      }
      return [...prev, id];
    });
  };

  const selectAllElements = () => {
    setSelectedElementIds(elements.map(el => el.id));
  };

  const clearSelection = () => {
    setSelectedElementId(null);
    setSelectedElementIds([]);
  };

  // Ativar modo desenho quando selecionar ferramenta
  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId);
    if (toolId && toolId !== 'hand') {
      setDrawingMode(true); // Ativar modo desenho ao selecionar ferramenta
    }
  };

  // Desativar modo desenho
  const exitDrawingMode = () => {
    setDrawingMode(false);
    setSelectedTool(null);
    clearSelection();
  };
  
  // Funções de clipboard
  const copyToClipboard = useCallback((type, data) => {
    setClipboard({ type, data: JSON.parse(JSON.stringify(data)) }); // Deep clone
  }, []);
  
  const pasteFromClipboard = useCallback(() => {
    if (!clipboard.type || !clipboard.data) return null;
    return clipboard;
  }, [clipboard]);
  
  // Funções de bloqueio
  const toggleLock = useCallback((id) => {
    setLockedElements(prev => {
      if (prev.includes(id)) {
        return prev.filter(elId => elId !== id);
      }
      return [...prev, id];
    });
    // Atualizar elemento também
    updateElement(id, { locked: !lockedElements.includes(id) });
  }, [lockedElements]);
  
  const isLocked = useCallback((id) => {
    return lockedElements.includes(id);
  }, [lockedElements]);
  
  // Funções de camadas (zIndex)
  const sendToBack = useCallback((id) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    const minZ = Math.min(...elements.map(el => el.zIndex ?? 0));
    updateElement(id, { zIndex: minZ - 1 });
  }, [elements]);
  
  const bringToFront = useCallback((id) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    const maxZ = Math.max(...elements.map(el => el.zIndex ?? 0));
    updateElement(id, { zIndex: maxZ + 1 });
  }, [elements]);
  
  const sendBackward = useCallback((id) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    const currentZ = element.zIndex ?? 0;
    updateElement(id, { zIndex: currentZ - 1 });
  }, [elements]);
  
  const bringForward = useCallback((id) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    const currentZ = element.zIndex ?? 0;
    updateElement(id, { zIndex: currentZ + 1 });
  }, [elements]);
  
  // Funções de transformação
  const flipHorizontal = useCallback((id) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    // Para elementos com width, inverter posição X
    if (element.width !== undefined) {
      // Lógica de inversão horizontal
      // Por enquanto, apenas marcar como invertido
      updateElement(id, { flippedHorizontal: !element.flippedHorizontal });
    }
  }, [elements]);
  
  const flipVertical = useCallback((id) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    // Para elementos com height, inverter posição Y
    if (element.height !== undefined) {
      // Lógica de inversão vertical
      updateElement(id, { flippedVertical: !element.flippedVertical });
    }
  }, [elements]);
  
  // Funções de link
  const addLink = useCallback((id, url) => {
    updateElement(id, { link: url });
  }, []);
  
  const removeLink = useCallback((id) => {
    updateElement(id, { link: null });
  }, []);
  
  // Funções de estilo
  const copyStyles = useCallback((id) => {
    const element = elements.find(el => el.id === id);
    if (element && element.style) {
      copyToClipboard('styles', element.style);
    }
  }, [elements, copyToClipboard]);
  
  const pasteStyles = useCallback((id) => {
    const clipboardData = pasteFromClipboard();
    if (clipboardData && clipboardData.type === 'styles') {
      updateElement(id, { style: clipboardData.data });
    }
  }, [pasteFromClipboard]);
  
  // Função para copiar elemento(s) para clipboard
  const copyElement = useCallback((id) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      copyToClipboard('element', element);
    }
  }, [elements, copyToClipboard]);
  
  const copyElements = useCallback((ids) => {
    const elementsToCopy = elements.filter(el => ids.includes(el.id));
    if (elementsToCopy.length > 0) {
      copyToClipboard('elements', elementsToCopy);
    }
  }, [elements, copyToClipboard]);
  
  // Função para colar elemento(s) do clipboard
  const pasteElement = useCallback((x, y) => {
    const clipboardData = pasteFromClipboard();
    if (!clipboardData || !clipboardData.data) return;
    
    if (clipboardData.type === 'element') {
      const newElement = {
        ...clipboardData.data,
        id: `element-${Date.now()}`,
        x: x ?? clipboardData.data.x + 10,
        y: y ?? clipboardData.data.y + 10,
      };
      addElement(newElement);
      setSelectedElementId(newElement.id);
    } else if (clipboardData.type === 'elements') {
      const newElements = clipboardData.data.map((el, index) => ({
        ...el,
        id: `element-${Date.now()}-${index}`,
        x: (x ?? el.x) + (index * 10),
        y: (y ?? el.y) + (index * 10),
      }));
      setElements(prev => {
        const updated = [...prev, ...newElements];
        saveToHistory(updated);
        return updated;
      });
      setSelectedElementIds(newElements.map(el => el.id));
    }
  }, [pasteFromClipboard, addElement, saveToHistory]);
  
  // Função para cortar elemento
  const cutElement = useCallback((id) => {
    copyElement(id);
    deleteElement(id);
  }, [copyElement, deleteElement]);
  
  // Função para remover todos os elementos
  const removeAllElements = useCallback(() => {
    setElements([]);
    saveToHistory([]);
    clearSelection();
  }, [saveToHistory, clearSelection]);

  return (
    <DrawingContext.Provider
      value={{
        selectedTool,
        setSelectedTool: handleToolSelect,
        elements,
        addElement,
        updateElement,
        updateFrameTitle,
        deleteElement,
        deleteElements,
        cloneElement,
        cloneElements,
        selectedElementId,
        setSelectedElementId,
        selectedElementIds,
        setSelectedElementIds,
        toggleElementSelection,
        selectAllElements,
        clearSelection,
        getSelectedElement,
        activeFrameId,
        setActiveFrameId,
        getElementsInFrame,
        undo,
        redo,
        canUndo,
        canRedo,
        drawingMode,
        setDrawingMode,
        exitDrawingMode,
        // Novos estados e funções
        defaultStyle,
        setDefaultStyle,
        selectedFramePreset,
        setSelectedFramePreset,
        framePlacementMode,
        setFramePlacementMode,
        pencilSmoothLevel,
        setPencilSmoothLevel,
        clipboard,
        copyToClipboard,
        pasteFromClipboard,
        lockedElements,
        toggleLock,
        isLocked,
        sendToBack,
        bringToFront,
        sendBackward,
        bringForward,
        flipHorizontal,
        flipVertical,
        addLink,
        removeLink,
        copyStyles,
        pasteStyles,
        copyElement,
        copyElements,
        pasteElement,
        cutElement,
        removeAllElements,
      }}
    >
      {children}
    </DrawingContext.Provider>
  );
};

