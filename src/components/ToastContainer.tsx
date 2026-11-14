import React from 'react';
import { useStore } from '../context/StoreContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useStore();
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="px-4 py-3 rounded-lg text-xs font-medium shadow-lg border pointer-events-auto"
          style={
            toast.tone === 'error'
              ? { backgroundColor: '#991B1B', color: '#FFFFFF', borderColor: '#7F1D1D' }
              : toast.tone === 'success'
              ? {
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)',
                  borderColor: 'var(--accent-hover)',
                }
              : {
                  backgroundColor: 'var(--surface)',
                  color: 'var(--ink)',
                  borderColor: 'var(--border-hairline)',
                }
          }
        >
          {toast.text}
        </div>
      ))}
    </div>
  );
};
