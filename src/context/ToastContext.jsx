import { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => {
    const push = (message, type = 'success', duration = 4000) => {
      const id = ++idRef.current;
      setToasts((current) => [...current, { id, message, type }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
    };
    return {
      toast: push,
      success: (msg, d) => push(msg, 'success', d),
      error: (msg, d) => push(msg, 'error', d ?? 6000),
      info: (msg, d) => push(msg, 'info', d),
    };
  }, [dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Fermer">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
