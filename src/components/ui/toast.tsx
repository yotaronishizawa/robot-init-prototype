import React, { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '../../lib/cn';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  success: () => {},
  error: () => {},
});

let _toast: ToastContextValue = { success: () => {}, error: () => {} };

export const toast = {
  success: (message: string) => _toast.success(message),
  error: (message: string) => _toast.error(message),
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  let nextId = 0;

  const add = useCallback((message: string, type: 'success' | 'error') => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const value: ToastContextValue = {
    success: (msg) => add(msg, 'success'),
    error: (msg) => add(msg, 'error'),
  };

  _toast = value;

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto',
              t.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-destructive text-destructive-foreground',
            )}
          >
            {t.type === 'success' ? '✓' : '✕'} {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
