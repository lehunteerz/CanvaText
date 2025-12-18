/**
 * Função throttle - limita a frequência de execução de uma função
 * @param {Function} func - Função a ser limitada
 * @param {number} delay - Delay em milissegundos
 * @returns {Function} - Função throttled
 */
export function throttle(func, delay = 100) {
  let lastCall = 0;
  let timeoutId = null;
  let lastArgs = null;

  return function throttled(...args) {
    const now = Date.now();
    lastArgs = args;

    if (now - lastCall >= delay) {
      // Executar imediatamente se passou o delay
      lastCall = now;
      func.apply(this, args);
    } else {
      // Agendar execução para quando o delay passar
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func.apply(this, lastArgs);
        timeoutId = null;
      }, delay - (now - lastCall));
    }
  };
}

/**
 * Hook para criar uma função throttled que persiste entre renders
 * @param {Function} func - Função a ser limitada
 * @param {number} delay - Delay em milissegundos
 * @returns {Function} - Função throttled memoizada
 */
export function useThrottle(func, delay = 100) {
  const { useRef, useCallback } = require('react');
  const funcRef = useRef(func);
  const throttledRef = useRef(null);

  // Atualizar a referência da função quando ela mudar
  useCallback(() => {
    funcRef.current = func;
  }, [func]);

  // Criar função throttled apenas uma vez
  if (!throttledRef.current) {
    throttledRef.current = throttle((...args) => {
      funcRef.current(...args);
    }, delay);
  }

  return throttledRef.current;
}

