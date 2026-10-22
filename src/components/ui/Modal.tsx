'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, description, className, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-[3px]" onClick={onClose} />
      <div
        ref={ref}
        className={cn('relative max-h-[92vh] w-full max-w-lg animate-pop overflow-y-auto rounded-xl2 bg-cream p-7 shadow-lift', className)}
      >
        <button data-close onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1 text-ink-400 hover:bg-cream-100 hover:text-ink">
          <X className="h-5 w-5" />
        </button>
        {title && <h3 className="mb-1 pr-8 font-serif text-2xl font-bold">{title}</h3>}
        {description && <p className="mb-5 text-sm text-ink-400">{description}</p>}
        {children}
      </div>
    </div>
  );
}
