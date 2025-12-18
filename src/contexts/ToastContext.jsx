import { createContext, useContext } from 'react';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const toast = useToast();
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Retornar um objeto vazio se não estiver dentro do provider (para evitar erros)
    return {
      toasts: [],
      showToast: () => () => {},
      removeToast: () => {},
      success: () => () => {},
      error: () => () => {},
      loading: () => () => {},
      info: () => () => {},
    };
  }
  return context;
};

