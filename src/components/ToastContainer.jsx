import { memo } from 'react';
import Toast from './Toast';

const ToastContainer = memo(function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-20 right-4 z-[10001] flex flex-col gap-2 pointer-events-none"
      style={{ WebkitAppRegion: 'no-drag' }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={onRemove}
          />
        </div>
      ))}
    </div>
  );
});

export default ToastContainer;

