'use client';

import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { dismissToast, type Toast } from '@/store/slices/uiSlice';

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const t = setTimeout(() => dispatch(dismissToast(toast.id)), 3500);
    return () => clearTimeout(t);
  }, [dispatch, toast.id]);
  const Icon = toast.tone === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div role="status" className="flex animate-fadeUp items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-cream shadow-lift">
      <Icon className={toast.tone === 'error' ? 'h-5 w-5 text-red-300' : 'h-5 w-5 text-brand'} />
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => dispatch(dismissToast(toast.id))} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useAppSelector(s => s.ui.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[130] flex flex-col items-center gap-2 px-4">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto w-full max-w-md">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
