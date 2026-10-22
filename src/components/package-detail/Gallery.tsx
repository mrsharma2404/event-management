'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SmartImage } from '@/components/ui/SmartImage';
import { cn } from '@/lib/cn';
import { track } from '@/lib/analytics/client';

export function Gallery({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const shown = photos.slice(0, 4);
  const go = useCallback((d: number) => setIndex(i => (i === null ? i : (i + d + photos.length) % photos.length)), [photos.length]);
  const open = (i: number, via: string) => {
    setIndex(i);
    track('event_gallery_opened', { photo_index: i + 1, photo_count: photos.length, via });
  };

  // Each photo shown in the lightbox (after the one it opened on).
  const opened = useRef<number | null>(null);
  useEffect(() => {
    if (index === null) { opened.current = null; return; }
    if (opened.current === null) { opened.current = index; return; }
    track('event_image_viewed', { photo_index: index + 1, photo_count: photos.length });
  }, [index, photos.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null);
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [index, go]);

  return (
    <>
      <div className="relative my-5">
      <div className="grid h-[300px] grid-cols-2 grid-rows-[2fr_1fr] gap-2.5 overflow-hidden rounded-xl2 sm:h-[420px] md:grid-cols-[2fr_1fr_1fr] md:grid-rows-2">
        {shown.map((p, i) => (
          <button key={i} onClick={() => open(i, 'thumbnail')} aria-label={`Open photo ${i + 1}`}
            className={cn('group relative overflow-hidden bg-cream-200',
              i === 0 && 'col-span-2 md:col-span-1 md:row-span-2',
              i === 3 && 'hidden md:col-span-2 md:block')}>
            <SmartImage photo={p} width={i === 0 ? 1200 : 700} fill priority={i === 0} sizes={i === 0 ? '(max-width:768px) 100vw, 50vw' : '25vw'}
              alt={i === 0 ? title : ''} className="transition duration-500 group-hover:scale-[1.04]" />
          </button>
        ))}
      </div>
        <button onClick={() => open(0, 'view_all')} className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm hover:bg-white">
          <Camera className="h-3.5 w-3.5" /> View all {photos.length} photos
        </button>
      </div>

      {index !== null && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4 sm:p-10" role="dialog" aria-modal="true" aria-label="Photo gallery"
          onClick={e => e.target === e.currentTarget && setIndex(null)}>
          <div className="relative h-full max-h-[86vh] w-full max-w-5xl">
            <SmartImage photo={photos[index]} width={1600} fill sizes="100vw" alt="" className="!bg-transparent object-contain" />
          </div>
          <span className="absolute left-1/2 top-5 -translate-x-1/2 text-sm text-white/80">{index + 1} / {photos.length}</span>
          {[
            { cls: 'right-5 top-5', label: 'Close', icon: X, fn: () => setIndex(null) },
            { cls: 'left-4 top-1/2', label: 'Previous', icon: ChevronLeft, fn: () => go(-1) },
            { cls: 'right-4 top-1/2', label: 'Next', icon: ChevronRight, fn: () => go(1) },
          ].map(b => (
            <button key={b.label} onClick={b.fn} aria-label={b.label} className={cn('absolute grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25', b.cls)}>
              <b.icon className="h-6 w-6" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
