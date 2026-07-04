import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeToast, selectToasts } from '../../store/uiSlice';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle size={18} className="text-emerald-400 shrink-0" />,
  error:   <XCircle    size={18} className="text-red-400 shrink-0" />,
  warning: <AlertTriangle size={18} className="text-yellow-400 shrink-0" />,
  info:    <Info       size={18} className="text-[#F7931A] shrink-0" />,
};

const borders = {
  success: 'border-l-emerald-400',
  error:   'border-l-red-400',
  warning: 'border-l-yellow-400',
  info:    'border-l-[#F7931A]',
};

const Toast = ({ toast }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(toast.id));
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  return (
    <div
      className={[
        'flex items-start gap-3 p-4 min-w-[300px] max-w-[420px]',
        'bg-[#0F1115] border border-white/10 border-l-4 rounded-xl',
        'shadow-[0_0_30px_-10px_rgba(0,0,0,0.8)]',
        borders[toast.type] || borders.info,
        'animate-[slideInRight_0.3s_ease-out]',
      ].join(' ')}
    >
      {icons[toast.type] || icons.info}
      <p className="text-white text-sm flex-1 leading-relaxed font-body">{toast.message}</p>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        className="text-[#94A3B8] hover:text-white transition-colors shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const toasts = useSelector(selectToasts);
  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export { Toast };
export default ToastContainer;
