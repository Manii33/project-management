'use client';
import { useEffect, useState } from 'react';
import { TOAST_EVENT_NAME, ToastPayload } from '@/lib/toast';

interface ToastItem extends ToastPayload {
  expiresAt: number;
}

const TOAST_DURATION = 5000;

export default function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const payload = (e as CustomEvent<ToastPayload>).detail;
      const item: ToastItem = { ...payload, expiresAt: Date.now() + TOAST_DURATION };
      setToasts((prev) => [...prev.slice(-4), item]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, TOAST_DURATION);
    };

    window.addEventListener(TOAST_EVENT_NAME, handler);
    return () => window.removeEventListener(TOAST_EVENT_NAME, handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2" role="alert" aria-live="assertive">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${
            toast.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-green-200 bg-green-50 text-green-700'
          }`}
        >
          <span className="text-base leading-none mt-0.5">{toast.type === 'error' ? '⛔' : '✅'}</span>
          <p className="flex-1 text-sm font-medium break-words">{toast.message}</p>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className={`text-sm leading-none hover:opacity-70 ${toast.type === 'error' ? 'text-red-500' : 'text-green-600'}`}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
