import { memo, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, X, Loader2 } from 'lucide-react';

const TOAST_TYPES = {
  success: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  loading: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  info: { icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
};

const Toast = memo(function Toast({ id, type = 'info', message, duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const Icon = TOAST_TYPES[type]?.icon || TOAST_TYPES.info.icon;
  const colors = TOAST_TYPES[type] || TOAST_TYPES.info;

  useEffect(() => {
    if (duration > 0 && type !== 'loading') {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, type]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose(id);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md
        ${colors.bg} ${colors.border}
        shadow-lg min-w-[280px] max-w-[400px]
        transition-all duration-300
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      <Icon
        size={20}
        className={`${colors.color} flex-shrink-0 ${type === 'loading' ? 'animate-spin' : ''}`}
      />
      <p className="text-sm text-white flex-1 font-medium">{message}</p>
      {type !== 'loading' && (
        <button
          type="button"
          onClick={handleClose}
          className="text-white/70 hover:text-white rounded p-0.5 transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          aria-label="Fechar notificação"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
});

export default Toast;

