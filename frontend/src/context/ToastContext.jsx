import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const activeMessagesRef = useRef(new Set());

  const removeToast = useCallback((id) => {
    setToasts((prev) => {
      const toastToRemove = prev.find((t) => t.id === id);
      if (toastToRemove) {
        activeMessagesRef.current.delete(toastToRemove.message);
      }
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const addToast = useCallback((type, message, duration = 4000) => {
    if (!message) return;
    const trimmedMessage = String(message).trim();

    // Prevent duplicate toasts from flooding the UI simultaneously
    if (activeMessagesRef.current.has(trimmedMessage)) {
      return;
    }

    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    activeMessagesRef.current.add(trimmedMessage);

    const newToast = { id, type, message: trimmedMessage };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => addToast('success', msg, duration),
    error: (msg, duration) => addToast('error', msg, duration),
    info: (msg, duration) => addToast('info', msg, duration),
    warning: (msg, duration) => addToast('warning', msg, duration),
  };

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      {/* Toast Notification Container */}
      <div 
        aria-live="polite" 
        className="fixed top-4 left-3 right-3 sm:left-auto sm:right-4 z-[9999] flex flex-col gap-2.5 max-w-sm sm:w-80 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-in slide-in-from-top-2 fade-in duration-200 ${
              t.type === 'success'
                ? 'bg-white/95 border-emerald-200 text-emerald-950 shadow-emerald-500/10'
                : t.type === 'error'
                ? 'bg-white/95 border-rose-200 text-rose-950 shadow-rose-500/10'
                : t.type === 'warning'
                ? 'bg-white/95 border-amber-200 text-amber-950 shadow-amber-500/10'
                : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-500/10'
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              )}
              {t.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              )}
              {t.type === 'warning' && (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
              {t.type === 'info' && (
                <Info className="w-5 h-5 text-secondary" />
              )}
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium leading-snug break-words">
                {t.message}
              </p>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

