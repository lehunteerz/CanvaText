import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Painel flutuante: arrastar pelo cabeçalho, posição em sessionStorage, recolher em aba lateral.
 * @param {Object} opts
 * @param {string} opts.storageKey
 * @param {'left'|'right'} opts.side
 * @param {number} [opts.fabOffsetPx=0] inset extra quando ancorado à direita (espaço do FAB)
 * @param {number} [opts.verticalBiasPx=0] deslocamento vertical em px (ex.: -80 para alinhar com outro FAB)
 */
export function useDraggablePanel({ storageKey, side, fabOffsetPx = 0, verticalBiasPx = 0 }) {
  const panelRef = useRef(null);
  const [pixelPos, setPixelPos] = useState(null);
  const [edgeCollapsed, setEdgeCollapsed] = useState(false);
  const pixelPosRef = useRef(null);

  useEffect(() => {
    pixelPosRef.current = pixelPos;
  }, [pixelPos]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.edgeCollapsed) setEdgeCollapsed(true);
      if (typeof data.left === 'number' && typeof data.top === 'number') {
        setPixelPos({ left: data.left, top: data.top });
      }
    } catch (_) {
      /* ignore */
    }
  }, [storageKey]);

  const persist = useCallback(
    (pos, collapsed) => {
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            left: pos?.left ?? null,
            top: pos?.top ?? null,
            edgeCollapsed: collapsed,
          })
        );
      } catch (_) {
        /* ignore */
      }
    },
    [storageKey]
  );

  const handleHeaderMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('button, a, input, select, textarea, [role="slider"]')) return;
      const el = panelRef.current;
      if (!el) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const ox = e.clientX - rect.left;
      const oy = e.clientY - rect.top;

      const onMove = (ev) => {
        let left = ev.clientX - ox;
        let top = ev.clientY - oy;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
        top = Math.max(8, Math.min(top, window.innerHeight - h - 8));
        setPixelPos({ left, top });
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (panelRef.current) {
          const r = panelRef.current.getBoundingClientRect();
          const next = { left: r.left, top: r.top };
          setPixelPos(next);
          persist(next, edgeCollapsed);
        }
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [persist, edgeCollapsed]
  );

  const toggleEdgeCollapsed = useCallback(() => {
    setEdgeCollapsed((c) => {
      const next = !c;
      persist(pixelPosRef.current, next);
      return next;
    });
  }, [persist]);

  const expandFromEdge = useCallback(() => {
    setEdgeCollapsed(false);
    persist(pixelPosRef.current, false);
  }, [persist]);

  /** Camadas editor: canvas ~10, painéis 50, faixa recolher 51, FABs 54, popup seleção 56 */
  const getPanelStyle = () => {
    const base = {
      position: 'fixed',
      zIndex: 50,
      maxHeight: '80vh',
      WebkitAppRegion: 'no-drag',
    };

    if (pixelPos) {
      return {
        ...base,
        left: pixelPos.left,
        top: pixelPos.top,
        transform: 'none',
      };
    }

    const yTransform = 'translateY(-50%)';
    if (side === 'right') {
      return {
        ...base,
        right: 16 + fabOffsetPx,
        top: verticalBiasPx ? `calc(50% + ${verticalBiasPx}px)` : '50%',
        transform: yTransform,
      };
    }

    return {
      ...base,
      left: 16,
      top: verticalBiasPx ? `calc(50% + ${verticalBiasPx}px)` : '50%',
      transform: yTransform,
    };
  };

  const collapseStripTopClass =
    verticalBiasPx !== 0
      ? `top-[calc(50%+${verticalBiasPx}px)] -translate-y-1/2`
      : 'top-1/2 -translate-y-1/2';

  const collapseStripClassName =
    side === 'right'
      ? `fixed right-0 ${collapseStripTopClass} z-[51] pointer-events-auto flex items-center justify-center w-7 py-10 rounded-l-lg border border-r-0 shadow-xl transition-colors`
      : `fixed left-0 top-1/2 -translate-y-1/2 z-[51] pointer-events-auto flex items-center justify-center w-7 py-10 rounded-r-lg border border-l-0 shadow-xl transition-colors`;

  return {
    panelRef,
    edgeCollapsed,
    toggleEdgeCollapsed,
    expandFromEdge,
    handleHeaderMouseDown,
    panelStyle: getPanelStyle(),
    collapseStripClassName,
    collapseStripSide: side,
    hasCustomPosition: !!pixelPos,
  };
}
