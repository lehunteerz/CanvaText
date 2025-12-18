import { useState, useCallback } from 'react';

let toastIdCounter = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = ++toastIdCounter;
    const newToast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, newToast]);
    
    // Retornar função para remover manualmente
    const removeFn = () => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    };
    
    return removeFn;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message, duration) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message, duration) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const loading = useCallback((message) => {
    return showToast(message, 'loading', 0); // Loading não fecha automaticamente
  }, [showToast]);

  const info = useCallback((message, duration) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    loading,
    info,
  };
};

