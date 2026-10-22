'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

export function StickyTabs({ tabs }: { tabs: { id: string; label: string }[] }) {
  const [active, setActive] = useState(tabs[0].id);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-140px 0px -60% 0px' },
    );
    tabs.forEach(t => { const el = document.getElementById(t.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [tabs]);

  return (
    <nav className="no-scrollbar sticky top-[72px] z-20 -mx-4 flex gap-1 overflow-x-auto border-b border-line bg-cream px-4 sm:mx-0 sm:px-0" aria-label="Package sections">
      {tabs.map(t => (
        <a key={t.id} href={`#${t.id}`} className={cn('whitespace-nowrap border-b-[2.5px] px-4 py-3.5 text-sm font-semibold transition',
          active === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-400 hover:text-brand-700')}>
          {t.label}
        </a>
      ))}
    </nav>
  );
}
