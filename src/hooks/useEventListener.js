import { useEffect, useRef } from 'react';

/**
 * Hook customizado para gerenciar event listeners com cleanup automático
 * Garante que listeners sejam removidos quando o componente desmonta ou dependências mudam
 * 
 * @param {string} eventName - Nome do evento (ex: 'click', 'keydown', 'mousemove')
 * @param {Function} handler - Função handler do evento
 * @param {EventTarget} element - Elemento onde adicionar o listener (padrão: window)
 * @param {Object} options - Opções do addEventListener (ex: { passive: true, capture: true })
 * 
 * @example
 * // Listener simples
 * useEventListener('keydown', handleKeyDown);
 * 
 * @example
 * // Listener em elemento específico
 * const buttonRef = useRef(null);
 * useEventListener('click', handleClick, buttonRef.current);
 * 
 * @example
 * // Listener com opções
 * useEventListener('scroll', handleScroll, window, { passive: true });
 */
export function useEventListener(eventName, handler, element = window, options) {
  // Ref para armazenar o handler atual
  // Isso permite que o handler mude sem precisar remover/adicionar o listener
  const savedHandler = useRef(handler);

  // Atualizar ref quando handler muda
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Verificar se elemento suporta addEventListener
    const isSupported = element && element.addEventListener;
    if (!isSupported) {
      console.warn(
        `[useEventListener] Elemento não suporta addEventListener:`,
        element
      );
      return;
    }

    // Criar listener que chama o handler atual da ref
    // Isso evita recriar o listener quando o handler muda
    const eventListener = (event) => {
      // Verificar se handler ainda existe antes de chamar
      if (savedHandler.current) {
        savedHandler.current(event);
      }
    };

    // Adicionar listener
    element.addEventListener(eventName, eventListener, options);

    // Remover listener no cleanup
    return () => {
      element.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]); // Re-executar se eventName, element ou options mudarem

  // Retornar função de cleanup manual (opcional)
  return () => {
    if (element && element.removeEventListener) {
      const eventListener = (event) => {
        if (savedHandler.current) {
          savedHandler.current(event);
        }
      };
      element.removeEventListener(eventName, eventListener, options);
    }
  };
}

/**
 * Hook para múltiplos event listeners de uma vez
 * Útil quando você precisa adicionar vários listeners ao mesmo elemento
 * 
 * @param {Array<{eventName: string, handler: Function, options?: Object}>} listeners - Array de configurações de listeners
 * @param {EventTarget} element - Elemento onde adicionar os listeners (padrão: window)
 * 
 * @example
 * useEventListeners([
 *   { eventName: 'keydown', handler: handleKeyDown },
 *   { eventName: 'keyup', handler: handleKeyUp },
 *   { eventName: 'resize', handler: handleResize, options: { passive: true } }
 * ]);
 */
export function useEventListeners(listeners, element = window) {
  useEffect(() => {
    if (!Array.isArray(listeners) || listeners.length === 0) {
      return;
    }

    const isSupported = element && element.addEventListener;
    if (!isSupported) {
      console.warn(
        `[useEventListeners] Elemento não suporta addEventListener:`,
        element
      );
      return;
    }

    // Criar handlers que chamam os handlers salvos
    const eventHandlers = listeners.map(({ eventName, handler, options }) => {
      const savedHandler = handler;
      const eventListener = (event) => {
        if (savedHandler) {
          savedHandler(event);
        }
      };
      
      element.addEventListener(eventName, eventListener, options);
      
      return { eventName, eventListener, options };
    });

    // Cleanup: remover todos os listeners
    return () => {
      eventHandlers.forEach(({ eventName, eventListener, options }) => {
        element.removeEventListener(eventName, eventListener, options);
      });
    };
  }, [listeners, element]);
}

/**
 * Hook para event listeners que precisam ser atualizados quando dependências mudam
 * Versão mais flexível que permite passar dependências extras
 * 
 * @param {string} eventName - Nome do evento
 * @param {Function} handler - Função handler
 * @param {EventTarget} element - Elemento
 * @param {Object} options - Opções do addEventListener
 * @param {Array} dependencies - Dependências extras para re-executar o effect
 */
export function useEventListenerWithDeps(
  eventName,
  handler,
  element = window,
  options,
  dependencies = []
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler, ...dependencies]);

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    const eventListener = (event) => {
      if (savedHandler.current) {
        savedHandler.current(event);
      }
    };

    element.addEventListener(eventName, eventListener, options);

    return () => {
      element.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options, ...dependencies]);
}

