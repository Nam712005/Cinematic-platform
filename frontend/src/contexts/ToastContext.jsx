import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

const TYPE_STYLES = {
  success: {
    icon: CheckCircle2,
    classes: 'border-emerald-500/40 bg-emerald-950/90 text-emerald-100',
    iconClass: 'text-emerald-400',
  },
  error: {
    icon: XCircle,
    classes: 'border-red-500/40 bg-red-950/90 text-red-100',
    iconClass: 'text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'border-amber-500/40 bg-amber-950/90 text-amber-100',
    iconClass: 'text-amber-400',
  },
  info: {
    icon: Info,
    classes: 'border-sky-500/40 bg-sky-950/90 text-sky-100',
    iconClass: 'text-sky-400',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (type, message, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (msg, duration) => push('success', msg, duration),
      error: (msg, duration) => push('error', msg, duration),
      warning: (msg, duration) => push('warning', msg, duration),
      info: (msg, duration) => push('info', msg, duration),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2.5">
        {toasts.map((item) => {
          const style = TYPE_STYLES[item.type] || TYPE_STYLES.info;
          const Icon = style.icon;
          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md transition-all ${style.classes}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} />
              <p className="flex-1 text-sm leading-relaxed">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
                aria-label="Đóng thông báo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
