import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDrawing } from '../contexts/DrawingContext';
import { throttle } from '../utils/throttle';
import { useEventListener } from '../hooks/useEventListener';
import ElementContextMenu from './drawing/ElementContextMenu';
import { finalizePencilPolyline, pointsToSmoothPathD } from '../utils/pencilPath';

// Gerador de ID único
let elementIdCounter = 0;
const generateId = () => `element-${Date.now()}-${++elementIdCounter}`;

const borderWidthPx = (s) => {
  const w = Number(s?.strokeWidth);
  return Number.isFinite(w) && w > 0 ? w : 1;
};

const frameBackgroundColor = (s, isActiveFrame) => {
  if (s?.fill && s.fill !== 'transparent') return s.fill;
  return isActiveFrame ? 'rgba(59, 130, 246, 0.09)' : 'rgba(148, 163, 184, 0.07)';
};

/** Distância mínima entre amostras do lápis (px) — reduz ruído e re-renders */
const PENCIL_MIN_SAMPLE_DIST = 1.15;

const DrawingCanvas = ({ theme = 'dark' }) => {
  const {
    selectedTool,
    elements,
    addElement,
    selectedElementId,
    setSelectedElementId,
    selectedElementIds,
    setSelectedElementIds,
    toggleElementSelection,
    clearSelection,
    activeFrameId,
    setActiveFrameId,
    getElementsInFrame,
    updateElement,
    updateFrameTitle,
    deleteElements,
    drawingMode,
    defaultStyle,
    selectedFramePreset,
    framePlacementMode,
    pencilSmoothLevel,
  } = useDrawing();

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentElement, setCurrentElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPositions, setDragStartPositions] = useState({}); // Para multi-arraste
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight);
  const [pencilPath, setPencilPath] = useState([]); // Para desenho livre com lápis
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);
  const [editingFrameId, setEditingFrameId] = useState(null);
  const [editingFrameTitle, setEditingFrameTitle] = useState('');
  const [contextMenuState, setContextMenuState] = useState({ isOpen: false, position: { x: 0, y: 0 }, element: null });
  const frameTitleInputRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  /** Traço do lápis completo (sempre atualizado; evita estado atrasado no mouseup) */
  const pencilPointsRef = useRef([]);
  const pencilPreviewRafRef = useRef(null);
  /** Evita closure obsoleta: mousemove global pode rodar antes do re-render após mousedown */
  const isPencilDrawingRef = useRef(false);
  
  // Refs para otimização com RAF
  const rafIdRef = useRef(null);
  const pendingUpdateRef = useRef(false);
  const lastMouseMoveRef = useRef(null);
  
  // Refs para valores que precisam estar atualizados no RAF
  const stateRefs = useRef({
    isDrawing,
    isDragging,
    isMultiSelecting,
    currentElement,
    startPos,
    selectedElementId,
    selectedElementIds,
    dragOffset,
    dragStartPositions,
    selectionBox,
    selectedTool,
    elements,
  });
  
  // Atualizar refs quando estado mudar
  useEffect(() => {
    stateRefs.current = {
      isDrawing,
      isDragging,
      isMultiSelecting,
      currentElement,
      startPos,
      selectedElementId,
      selectedElementIds,
      dragOffset,
      dragStartPositions,
      selectionBox,
      selectedTool,
      elements,
    };
  }, [isDrawing, isDragging, isMultiSelecting, currentElement, startPos, selectedElementId, selectedElementIds, dragOffset, dragStartPositions, selectionBox, selectedTool, elements]);

  const isLightTheme = theme === 'light';

  // Obter coordenadas relativas ao canvas (considerando scroll)
  const getRelativeCoordinates = useCallback((e) => {
    if (!canvasRef.current) {
      console.warn('Canvas not ready for coordinates');
      return null; // Retornar null ao invés de coordenadas inválidas
    }
    
    const canvas = canvasRef.current;
    const canvasRect = canvas.getBoundingClientRect();
    
    // Coordenadas da viewport relativas ao canvas
    const viewportX = e.clientX - canvasRect.left;
    const viewportY = e.clientY - canvasRect.top;
    
    // Obter scroll do container de scroll
    let scrollX = 0;
    let scrollY = 0;
    
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      scrollX = container.scrollLeft || 0;
      scrollY = container.scrollTop || 0;
    }
    
    // Coordenadas absolutas no canvas (viewport + scroll)
    // O canvas está fixo na tela, então precisamos adicionar o scroll
    return {
      x: viewportX + scrollX,
      y: viewportY + scrollY,
    };
  }, []);

  // Verificar se ponto está dentro de um frame (memoizado para performance)
  const framesMemo = useMemo(() => elements.filter(el => el.type === 'frame'), [elements]);
  
  const getFrameAtPoint = useCallback((x, y) => {
    // Iterar do último para o primeiro (frames mais recentes primeiro)
    for (let i = framesMemo.length - 1; i >= 0; i--) {
      const frame = framesMemo[i];
      // Verificar se o ponto está dentro do frame (considerando bordas)
      if (
        x >= frame.x &&
        x <= frame.x + frame.width &&
        y >= frame.y &&
        y <= frame.y + frame.height
      ) {
        return frame;
      }
    }
    return null;
  }, [framesMemo]);

  // Iniciar desenho ou arrastar
  const handleMouseDown = useCallback((e) => {
    // Não processar se clicar em controles ou painéis
    if (e.target.closest('[data-drawing-control]') || 
        e.target.closest('[data-side-panel]') ||
        e.target.closest('button') ||
        e.target.closest('select') ||
        e.target.closest('input')) {
      return;
    }

    const coords = getRelativeCoordinates(e);
    if (!coords) return; // Se coordenadas inválidas, não processar
    
    const { x, y } = coords;

    // Se ferramenta é mão, tentar selecionar/arrastar elemento
    if (selectedTool === 'hand') {
      const clickedElement = elements
        .slice()
        .reverse()
        .find(el => {
          if (el.frameId) return false; // Ignorar elementos dentro de frames na seleção raiz
          
          if (el.type === 'line') {
            const dist = Math.sqrt(
              Math.pow(x - (el.x + el.width / 2), 2) +
              Math.pow(y - (el.y + el.height / 2), 2)
            );
            return dist < 15;
          }
          return (
            x >= el.x &&
            x <= el.x + el.width &&
            y >= el.y &&
            y <= el.y + el.height
          );
        });

      if (clickedElement) {
        e.preventDefault();
        e.stopPropagation();
        
        // Multi-seleção com Shift
        if (e.shiftKey) {
          toggleElementSelection(clickedElement.id);
        } else {
          setSelectedElementId(clickedElement.id);
          const ids = [clickedElement.id];
          setSelectedElementIds(ids);
          setIsDragging(true);
          setDragOffset({
            x: x - clickedElement.x,
            y: y - clickedElement.y,
          });
          // Salvar posições iniciais para multi-arraste
          const startPositions = {};
          ids.forEach(id => {
            const el = elements.find(e => e.id === id);
            if (el) {
              startPositions[id] = { x: el.x, y: el.y };
            }
          });
          setDragStartPositions(startPositions);
        }
      } else {
        // Iniciar seleção por arraste se Shift não estiver pressionado
        if (!e.shiftKey) {
          setSelectedElementId(null);
          setSelectedElementIds([]);
          setIsMultiSelecting(true);
          setSelectionBox({ x, y, width: 0, height: 0 });
          setStartPos({ x, y });
        }
      }
      return;
    }

    // Se não há ferramenta selecionada, não fazer nada
    if (!selectedTool || selectedTool === 'eraser') return;

    e.preventDefault();
    e.stopPropagation();

    // Quadro por preset: um clique coloca o tamanho exato (Figma-like)
    if (
      selectedTool === 'frame' &&
      framePlacementMode === 'preset' &&
      selectedFramePreset
    ) {
      const w = selectedFramePreset.width;
      const h = selectedFramePreset.height;
      const presetElement = {
        id: generateId(),
        type: 'frame',
        x,
        y,
        width: w,
        height: h,
        frameId: null,
        title: selectedFramePreset.label,
        framePresetId: selectedFramePreset.id,
        zIndex: undefined,
        locked: false,
        link: null,
        style: { ...defaultStyle },
      };
      addElement(presetElement);
      setActiveFrameId(presetElement.id);
      return;
    }

    // Verificar se está dentro de um frame (exceto quando criando um novo frame)
    let frame = null;
    let frameId = null;
    if (selectedTool !== 'frame') {
      frame = getFrameAtPoint(x, y);
      frameId = frame ? frame.id : null;
    }

    // Se está dentro de um frame e não é ferramenta de frame, ajustar coordenadas relativas ao frame
    let adjustedX = x;
    let adjustedY = y;
    if (frame && selectedTool !== 'frame' && selectedTool !== 'pencil') {
      adjustedX = x - frame.x;
      adjustedY = y - frame.y;
    }

    // Lápis: amostragem em coordenadas do canvas
    if (selectedTool === 'pencil') {
      isPencilDrawingRef.current = true;
      setIsDrawing(true);
      pencilPointsRef.current = [{ x, y }];
      setPencilPath([{ x, y }]);
      return;
    }

    setIsDrawing(true);
    setStartPos({ x: adjustedX, y: adjustedY });

    const newElement = {
      id: generateId(),
      type: selectedTool,
      x: adjustedX,
      y: adjustedY,
      width: 0,
      height: 0,
      frameId: frameId,
      title: selectedTool === 'frame' ? 'Quadro' : undefined,
      framePresetId: selectedTool === 'frame' ? null : undefined,
      zIndex: undefined,
      locked: false,
      link: null,
      style: { ...defaultStyle },
    };

    setCurrentElement(newElement);
  }, [
    selectedTool,
    elements,
    getFrameAtPoint,
    getRelativeCoordinates,
    defaultStyle,
    selectedFramePreset,
    framePlacementMode,
    addElement,
    setActiveFrameId,
  ]);

  // Handler interno para mouse move (otimizado com RAF)
  const handleMouseMoveInternal = useCallback((e) => {
    const coords = getRelativeCoordinates(e);
    if (!coords) return;
    
    const { x, y } = coords;
    
    // Armazenar última posição para processamento via RAF
    lastMouseMoveRef.current = { x, y, event: e };
    pendingUpdateRef.current = true;

    // Lápis: usa ref (isPencilDrawingRef) para não depender de isDrawing em closure desatualizada
    if (selectedTool === 'pencil' && isPencilDrawingRef.current) {
      const pts = pencilPointsRef.current;
      const last = pts[pts.length - 1];
      if (
        last &&
        Math.hypot(x - last.x, y - last.y) < PENCIL_MIN_SAMPLE_DIST
      ) {
        return;
      }
      pts.push({ x, y });
      if (!pencilPreviewRafRef.current) {
        pencilPreviewRafRef.current = requestAnimationFrame(() => {
          pencilPreviewRafRef.current = null;
          setPencilPath([...pencilPointsRef.current]);
        });
      }
      return;
    }

    // Para outros casos, agendar atualização via RAF
    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (!pendingUpdateRef.current || !lastMouseMoveRef.current) return;
        
        pendingUpdateRef.current = false;
        const { x: rafX, y: rafY } = lastMouseMoveRef.current;
        
        // Usar valores atualizados dos refs
        const state = stateRefs.current;

        // Atualizar caixa de seleção múltipla
        if (state.isMultiSelecting && state.selectionBox) {
          const width = Math.abs(rafX - state.startPos.x);
          const height = Math.abs(rafY - state.startPos.y);
          const minX = Math.min(state.startPos.x, rafX);
          const minY = Math.min(state.startPos.y, rafY);
          setSelectionBox({ x: minX, y: minY, width, height });
          return;
        }

        // Arrastar elemento(s)
        if (state.isDragging) {
          if (state.selectedElementIds.length > 1) {
            const firstId = state.selectedElementIds[0];
            const firstStartPos = state.dragStartPositions[firstId];
            if (firstStartPos) {
              const newFirstX = rafX - state.dragOffset.x;
              const newFirstY = rafY - state.dragOffset.y;
              const deltaX = newFirstX - firstStartPos.x;
              const deltaY = newFirstY - firstStartPos.y;
              
              state.selectedElementIds.forEach(id => {
                const startPos = state.dragStartPositions[id];
                if (startPos) {
                  updateElement(id, { 
                    x: startPos.x + deltaX, 
                    y: startPos.y + deltaY 
                  }, true);
                }
              });
            }
          } else if (state.selectedElementId) {
            const newX = rafX - state.dragOffset.x;
            const newY = rafY - state.dragOffset.y;
            updateElement(state.selectedElementId, { x: newX, y: newY }, true);
          }
          return;
        }

        // Desenhar novo elemento
        if (!state.isDrawing || !state.currentElement) return;

        const width = Math.abs(rafX - state.startPos.x);
        const height = Math.abs(rafY - state.startPos.y);
        const minX = Math.min(state.startPos.x, rafX);
        const minY = Math.min(state.startPos.y, rafY);

        let adjustedX = minX;
        let adjustedY = minY;
        if (state.currentElement.frameId && state.currentElement.type !== 'frame') {
          const frame = state.elements.find(el => el.id === state.currentElement.frameId);
          if (frame) {
            adjustedX = Math.max(0, Math.min(minX, frame.width - width));
            adjustedY = Math.max(0, Math.min(minY, frame.height - height));
          }
        } else if (state.currentElement.type === 'frame') {
          adjustedX = minX;
          adjustedY = minY;
        }

        setCurrentElement({
          ...state.currentElement,
          x: adjustedX,
          y: adjustedY,
          width,
          height,
        });
      });
    }
  }, [
    updateElement,
    setSelectionBox,
    setCurrentElement,
    selectedTool,
    isDrawing,
    setPencilPath,
  ]);

  // Throttle mouse move para melhor performance (exceto para lápis)
  // Para lápis, usar handler direto. Para outros, usar throttle + RAF
  const handleMouseMove = useMemo(() => {
    if (selectedTool === 'pencil') {
      return handleMouseMoveInternal; // Sem throttle para lápis (precisa ser suave)
    }
    // Throttle de 16ms (~60fps) combinado com RAF para renderização suave
    return throttle(handleMouseMoveInternal, 16);
  }, [handleMouseMoveInternal, selectedTool]);
  
  // Cleanup RAF ao desmontar
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (pencilPreviewRafRef.current) {
        cancelAnimationFrame(pencilPreviewRafRef.current);
        pencilPreviewRafRef.current = null;
      }
      pendingUpdateRef.current = false;
      lastMouseMoveRef.current = null;
    };
  }, []);

  // Finalizar desenho ou arrastar
  const handleMouseUp = useCallback(() => {
    // Finalizar seleção múltipla
    if (isMultiSelecting && selectionBox) {
      const selected = elements.filter(el => {
        if (el.frameId) return false;
        return (
          el.x < selectionBox.x + selectionBox.width &&
          el.x + el.width > selectionBox.x &&
          el.y < selectionBox.y + selectionBox.height &&
          el.y + el.height > selectionBox.y
        );
      });
      const selectedIds = selected.map(el => el.id);
      setSelectedElementIds(selectedIds);
      if (selectedIds.length === 1) {
        setSelectedElementId(selectedIds[0]);
      } else {
        setSelectedElementId(null);
      }
      setIsMultiSelecting(false);
      setSelectionBox(null);
      return;
    }

    if (isDragging) {
      setIsDragging(false);
      return;
    }

    // Finalizar desenho livre com lápis (suavização + simplificação ao soltar)
    if (selectedTool === 'pencil' && isPencilDrawingRef.current) {
      isPencilDrawingRef.current = false;
      if (pencilPreviewRafRef.current) {
        cancelAnimationFrame(pencilPreviewRafRef.current);
        pencilPreviewRafRef.current = null;
      }

      let raw = pencilPointsRef.current.length
        ? [...pencilPointsRef.current]
        : [...pencilPath];

      pencilPointsRef.current = [];
      setPencilPath([]);

      let processed = finalizePencilPolyline(raw, pencilSmoothLevel);
      if (processed.length === 1) {
        const p = processed[0];
        processed = [p, { x: p.x + 1.2, y: p.y + 1.2 }];
      }

      if (processed.length >= 2) {
        const xs = processed.map((p) => p.x);
        const ys = processed.map((p) => p.y);
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        const width = Math.max(maxX - minX, 1);
        const height = Math.max(maxY - minY, 1);

        const adjustedPath = processed.map((p) => ({
          x: p.x - minX,
          y: p.y - minY,
        }));

        const frame = getFrameAtPoint(minX, minY);
        const frameId = frame ? frame.id : null;

        let finalX = minX;
        let finalY = minY;

        if (frameId) {
          finalX = minX - frame.x;
          finalY = minY - frame.y;
        }

        const pencilElement = {
          id: generateId(),
          type: 'pencil',
          x: finalX,
          y: finalY,
          width,
          height,
          path: adjustedPath,
          frameId: frameId,
          zIndex: undefined,
          locked: false,
          link: null,
          style: { ...defaultStyle },
        };

        addElement(pencilElement);
      }

      setIsDrawing(false);
      return;
    }

    if (!isDrawing || !currentElement) return;

    // Só adicionar se tiver tamanho mínimo
    if (currentElement.width > 5 || currentElement.height > 5) {
      // Para frames, garantir que não está dentro de outro frame (frames são sempre raiz)
      const finalElement = currentElement.type === 'frame' 
        ? { ...currentElement, frameId: null }
        : currentElement;
      
      addElement(finalElement);
      
      // Se criou um frame, ativar ele automaticamente
      if (finalElement.type === 'frame') {
        setActiveFrameId(finalElement.id);
      }
    }

    setIsDrawing(false);
    setCurrentElement(null);
  }, [isDrawing, currentElement, isDragging, isMultiSelecting, selectionBox, addElement, setActiveFrameId, selectedTool, pencilPath, getFrameAtPoint, elements, selectedElementIds, selectedElementId, updateElement, startPos, toggleElementSelection, defaultStyle, setSelectedElementId, setSelectedElementIds, pencilSmoothLevel]);

  // Event listeners globais para mouse (otimizado - condicional)
  useEffect(() => {
    if (!isDrawing && !isDragging && !isMultiSelecting) return;

    const handleGlobalMouseMove = (e) => {
      handleMouseMove(e);
    };
    
    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false, capture: true });
    document.addEventListener('mouseup', handleGlobalMouseUp, { capture: true });
    document.addEventListener('mouseleave', handleGlobalMouseUp, { capture: true });

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove, { capture: true });
      document.removeEventListener('mouseup', handleGlobalMouseUp, { capture: true });
      document.removeEventListener('mouseleave', handleGlobalMouseUp, { capture: true });
    };
  }, [isDrawing, isDragging, isMultiSelecting, handleMouseMove, handleMouseUp]);

  // Encontrar o container de scroll e atualizar referência
  useEffect(() => {
    let timeoutId = null;
    let checkInterval = null;

    const findScrollContainer = () => {
      // Buscar container específico do editor primeiro
      const scrollContainer = document.getElementById('editor-scroll-container') ||
                              document.querySelector('[data-scroll-container]') ||
                              document.querySelector('.flex-1.overflow-y-auto') ||
                              document.querySelector('.overflow-y-auto');
      
      if (scrollContainer) {
        scrollContainerRef.current = scrollContainer;
        return true;
      }
      return false;
    };

    // Tentar encontrar imediatamente
    if (findScrollContainer()) {
      return;
    }

    // Aguardar um pouco para garantir que o DOM está pronto
    timeoutId = setTimeout(() => {
      findScrollContainer();
    }, 100);
    
    // Também tentar encontrar quando o canvas for montado (com limite de tentativas)
    let attempts = 0;
    const maxAttempts = 20; // Limite de tentativas para evitar loop infinito
    checkInterval = setInterval(() => {
      if (canvasRef.current && findScrollContainer()) {
        clearInterval(checkInterval);
      } else if (++attempts >= maxAttempts) {
        clearInterval(checkInterval);
      }
    }, 50);
    
    const handleResize = () => findScrollContainer();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);
  
  // Usar useEventListener para resize (melhor cleanup)
  useEventListener('resize', useCallback(() => {
    const findScrollContainer = () => {
      const scrollContainer = document.getElementById('editor-scroll-container') ||
                              document.querySelector('[data-scroll-container]') ||
                              document.querySelector('.flex-1.overflow-y-auto') ||
                              document.querySelector('.overflow-y-auto');
      
      if (scrollContainer) {
        scrollContainerRef.current = scrollContainer;
      }
    };
    findScrollContainer();
  }, []), window);

  // Renderizar elemento
  const renderElement = (element, isInFrame = false) => {
    const { id, type, x, y, width, height, style, frameId } = element;
    const isSelected = selectedElementId === id;
    const isActiveFrame = activeFrameId === id && type === 'frame';

    // Usar zIndex do elemento ou padrão baseado na ordem
    const elementZIndex = element.zIndex ?? (elements.indexOf(element) + 1);
    const isLocked = element.locked ?? false;
    
    const baseStyle = {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      pointerEvents: (selectedTool === 'hand' && !isLocked) ? 'auto' : type === 'frame' ? 'auto' : 'none',
      cursor: isLocked ? 'not-allowed' : selectedTool === 'hand' ? 'move' : 'default',
      zIndex: isSelected ? 1000 : type === 'frame' ? 100 : elementZIndex,
      opacity: (element.style?.opacity ?? 100) / 100,
    };

    // Estilo de seleção
    const selectionStyle = isSelected ? {
      outline: `2px dashed ${style.stroke}`,
      outlineOffset: '2px',
    } : {};

    switch (type) {
      case 'rectangle':
        return (
          <div
            key={id}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedTool === 'hand') {
                setSelectedElementId(id);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (selectedTool === 'hand' && isSelected) {
                setContextMenuState({
                  isOpen: true,
                  position: { x: e.clientX, y: e.clientY },
                  element: element,
                });
              }
            }}
            style={{
              ...baseStyle,
              ...selectionStyle,
              width: `${width}px`,
              height: `${height}px`,
              border: `${borderWidthPx(style)}px solid ${style.stroke}`,
              backgroundColor: style.fill === 'transparent' ? 'transparent' : style.fill,
              boxSizing: 'border-box',
            }}
          />
        );

      case 'circle':
        return (
          <div
            key={id}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedTool === 'hand') {
                setSelectedElementId(id);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (selectedTool === 'hand' && isSelected) {
                setContextMenuState({
                  isOpen: true,
                  position: { x: e.clientX, y: e.clientY },
                  element: element,
                });
              }
            }}
            style={{
              ...baseStyle,
              ...selectionStyle,
              width: `${width}px`,
              height: `${height}px`,
              borderRadius: '50%',
              border: `${borderWidthPx(style)}px solid ${style.stroke}`,
              backgroundColor: style.fill === 'transparent' ? 'transparent' : style.fill,
              boxSizing: 'border-box',
            }}
          />
        );

      case 'diamond':
        return (
          <div
            key={id}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedTool === 'hand') {
                setSelectedElementId(id);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (selectedTool === 'hand' && isSelected) {
                setContextMenuState({
                  isOpen: true,
                  position: { x: e.clientX, y: e.clientY },
                  element: element,
                });
              }
            }}
            style={{
              ...baseStyle,
              ...selectionStyle,
              width: `${width}px`,
              height: `${height}px`,
              transform: 'rotate(45deg)',
              border: `${borderWidthPx(style)}px solid ${style.stroke}`,
              backgroundColor: style.fill === 'transparent' ? 'transparent' : style.fill,
              boxSizing: 'border-box',
            }}
          />
        );

      case 'line':
        return (
          <svg
            key={id}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedTool === 'hand') {
                setSelectedElementId(id);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (selectedTool === 'hand' && isSelected) {
                setContextMenuState({
                  isOpen: true,
                  position: { x: e.clientX, y: e.clientY },
                  element: element,
                });
              }
            }}
            style={{
              ...baseStyle,
              ...selectionStyle,
              width: `${Math.max(width, 1)}px`,
              height: `${Math.max(height, 1)}px`,
              overflow: 'visible',
            }}
          >
            <line
              x1="0"
              y1="0"
              x2={width}
              y2={height}
              stroke={style.stroke}
              strokeWidth={borderWidthPx(style)}
            />
          </svg>
        );

      case 'arrow': {
        const sw = borderWidthPx(style);
        const safeMarkerId = `arrowhead-${String(id).replace(/[^a-zA-Z0-9_-]/g, '')}`;
        return (
          <svg
            key={id}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedTool === 'hand') {
                setSelectedElementId(id);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (selectedTool === 'hand' && isSelected) {
                setContextMenuState({
                  isOpen: true,
                  position: { x: e.clientX, y: e.clientY },
                  element: element,
                });
              }
            }}
            style={{
              ...baseStyle,
              ...selectionStyle,
              width: `${Math.max(Math.abs(width), 1)}px`,
              height: `${Math.max(Math.abs(height), 1)}px`,
              overflow: 'visible',
            }}
          >
            <defs>
              <marker
                id={safeMarkerId}
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <polygon points="0 0, 10 3, 0 6" fill={style.stroke} />
              </marker>
            </defs>
            <line
              x1="0"
              y1="0"
              x2={width}
              y2={height}
              stroke={style.stroke}
              strokeWidth={sw}
              markerEnd={`url(#${safeMarkerId})`}
            />
          </svg>
        );
      }

      case 'frame':
        const frameElements = getElementsInFrame(id);
        const frameTitle = element.title || 'Frame';
        const isEditing = editingFrameId === id;
        
        return (
          <div
            key={id}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedTool === 'hand' && !isEditing) {
                setSelectedElementId(id);
                setActiveFrameId(id);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (selectedTool === 'hand' && isSelected) {
                setContextMenuState({
                  isOpen: true,
                  position: { x: e.clientX, y: e.clientY },
                  element: element,
                });
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (selectedTool === 'hand') {
                setEditingFrameId(id);
                setEditingFrameTitle(frameTitle);
                // Focar no input após um pequeno delay
                setTimeout(() => {
                  frameTitleInputRef.current?.focus();
                  frameTitleInputRef.current?.select();
                }, 10);
              }
            }}
            style={{
              ...baseStyle,
              ...selectionStyle,
              width: `${width}px`,
              height: `${height}px`,
              border: isActiveFrame
                ? `${borderWidthPx(style) + 1}px solid ${style.stroke}`
                : `${borderWidthPx(style)}px dashed ${style.stroke}`,
              backgroundColor: frameBackgroundColor(style, isActiveFrame),
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            {/* Título do Frame - Editável */}
            {isEditing ? (
              <input
                ref={frameTitleInputRef}
                type="text"
                value={editingFrameTitle}
                onChange={(e) => setEditingFrameTitle(e.target.value)}
                onBlur={() => {
                  if (editingFrameTitle.trim()) {
                    updateFrameTitle(id, editingFrameTitle.trim());
                  }
                  setEditingFrameId(null);
                  setEditingFrameTitle('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (editingFrameTitle.trim()) {
                      updateFrameTitle(id, editingFrameTitle.trim());
                    }
                    setEditingFrameId(null);
                    setEditingFrameTitle('');
                  } else if (e.key === 'Escape') {
                    setEditingFrameId(null);
                    setEditingFrameTitle('');
                  }
                }}
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '0',
                  fontSize: '12px',
                  color: style.stroke,
                  fontWeight: '500',
                  backgroundColor: isLightTheme ? '#ffffff' : '#1a1a1a',
                  border: `1px solid ${style.stroke}`,
                  borderRadius: '4px',
                  padding: '2px 6px',
                  minWidth: '60px',
                  outline: 'none',
                  pointerEvents: 'auto',
                  zIndex: 1001,
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (selectedTool === 'hand') {
                    setEditingFrameId(id);
                    setEditingFrameTitle(frameTitle);
                    setTimeout(() => {
                      frameTitleInputRef.current?.focus();
                      frameTitleInputRef.current?.select();
                    }, 10);
                  }
                }}
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '0',
                  fontSize: '12px',
                  color: style.stroke,
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  pointerEvents: selectedTool === 'hand' ? 'auto' : 'none',
                  cursor: selectedTool === 'hand' ? 'text' : 'default',
                }}
                title="Duplo clique para editar título"
              >
                {frameTitle}
              </div>
            )}
            
            {/* Renderizar elementos dentro do frame */}
            {frameElements.map(el => renderElement(el, true))}
          </div>
        );

      case 'pencil': {
        const path = element.path || [];
        if (path.length === 0) return null;

        const pathData = pointsToSmoothPathD(path);
        if (!pathData) return null;

        return (
          <svg
            key={id}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedTool === 'hand') {
                setSelectedElementId(id);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (selectedTool === 'hand' && isSelected) {
                setContextMenuState({
                  isOpen: true,
                  position: { x: e.clientX, y: e.clientY },
                  element: element,
                });
              }
            }}
            style={{
              ...baseStyle,
              ...selectionStyle,
              width: `${width}px`,
              height: `${height}px`,
              overflow: 'visible',
            }}
          >
            <path
              d={pathData}
              stroke={style.stroke}
              strokeWidth={borderWidthPx(style)}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              pointerEvents="stroke"
            />
          </svg>
        );
      }

      default:
        return null;
    }
  };

  // Calcular altura mínima do canvas baseado no conteúdo ou viewport
  const updateCanvasHeight = useCallback(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer && scrollContainer.scrollHeight) {
      setCanvasHeight(Math.max(scrollContainer.scrollHeight, window.innerHeight));
    } else {
      setCanvasHeight(Math.max(document.documentElement.scrollHeight, window.innerHeight));
    }
  }, []);

  useEffect(() => {
    updateCanvasHeight();
    const observer = new MutationObserver(updateCanvasHeight);
    
    if (scrollContainerRef.current) {
      observer.observe(scrollContainerRef.current, { childList: true, subtree: true });
    }
    
    return () => {
      observer.disconnect();
    };
  }, [updateCanvasHeight]);
  
  // Usar useEventListener para resize
  useEventListener('resize', updateCanvasHeight, window);

  // Separar elementos por frame
  const rootElements = elements.filter(el => !el.frameId);

  // Renderizar sempre quando em modo desenho ou quando há elementos
  if (!drawingMode && elements.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full pointer-events-none"
      style={{ 
        zIndex: 10,
        height: `${canvasHeight}px`,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div
        ref={canvasRef}
        className="absolute w-full"
        style={{
          cursor: selectedTool === 'hand' ? 'grab' : selectedTool ? 'crosshair' : 'default',
          pointerEvents: drawingMode || elements.length > 0 ? 'auto' : 'none',
          height: `${canvasHeight}px`,
          minHeight: '100vh',
          top: 0,
          left: 0,
        }}
        onMouseDown={handleMouseDown}
        data-drawing-canvas
      >
        {/* Renderizar elementos raiz (sem frame) */}
        {rootElements.map(el => renderElement(el))}

        {/* Renderizar elemento atual sendo desenhado */}
        {currentElement && renderElement(currentElement)}
        
        {/* Renderizar path do lápis enquanto desenha */}
        {selectedTool === 'pencil' && isDrawing && pencilPath.length > 1 && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              overflow: 'visible',
              zIndex: 1000,
            }}
          >
            <path
              d={pointsToSmoothPathD(pencilPath)}
              stroke={defaultStyle.stroke}
              strokeWidth={borderWidthPx(defaultStyle)}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Caixa de seleção múltipla */}
        {isMultiSelecting && selectionBox && selectionBox.width > 0 && selectionBox.height > 0 && (
          <div
            style={{
              position: 'absolute',
              left: `${selectionBox.x}px`,
              top: `${selectionBox.y}px`,
              width: `${selectionBox.width}px`,
              height: `${selectionBox.height}px`,
              border: `2px dashed ${isLightTheme ? '#3b82f6' : '#60a5fa'}`,
              backgroundColor: `${isLightTheme ? '#3b82f620' : '#60a5fa20'}`,
              pointerEvents: 'none',
              zIndex: 999,
            }}
          />
        )}
      </div>

      {/* Menu de Contexto do Elemento */}
      {contextMenuState.isOpen && contextMenuState.element && (
        <ElementContextMenu
          element={contextMenuState.element}
          position={contextMenuState.position}
          onClose={() => setContextMenuState({ isOpen: false, position: { x: 0, y: 0 }, element: null })}
          theme={isLightTheme ? 'light' : 'dark'}
        />
      )}
    </div>
  );
};

export default DrawingCanvas;
