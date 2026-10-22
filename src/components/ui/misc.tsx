import Link from 'next/link';
import { ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold', className)}>✦ {children}</span>;
}

export function SectionHeading({ eyebrow, title, description, action, className }: {
  eyebrow?: string; title: string; description?: string; action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end', className)}>
      <div className="max-w-2xl">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-bold leading-tight">{title}</h2>
        {description && <p className="mt-2 text-ink-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Breadcrumbs({ items, light }: { items: { label: string; href?: string }[]; light?: boolean }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex flex-wrap items-center gap-1 text-sm', light ? 'text-white/85' : 'text-ink-400')}>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
          {it.href ? <Link href={it.href} className="hover:underline">{it.label}</Link> : <span aria-current="page" className="line-clamp-1">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function RatingBadge({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md bg-success px-1.5 py-0.5 text-xs font-bold text-white', className)}>
      <Star className="h-3 w-3 fill-current" /> {rating.toFixed(1)}
    </span>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex text-gold', className)} aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn('h-4 w-4', i < Math.round(value) ? 'fill-current' : 'opacity-30')} />
      ))}
    </span>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-block rounded-md bg-gold px-2.5 py-1 text-[0.72rem] font-bold tracking-wide text-white', className)}>{children}</span>;
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('rounded-xl2 bg-white p-6 shadow-card', className)}>{children}</div>;
}

export function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="col-span-full rounded-xl2 bg-white px-6 py-14 text-center shadow-card">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-cream-100 text-brand-700">{icon}</div>
      <h3 className="mb-1 font-serif text-xl font-bold">{title}</h3>
      {description && <p className="mx-auto mb-5 max-w-md text-ink-400">{description}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-cream-200/70', className)} />;
}

export function Accordion({ items, defaultOpen = 0 }: { items: { q: string; a: string }[]; defaultOpen?: number }) {
  return (
    <div className="space-y-2.5">
      {items.map((it, i) => (
        <details key={it.q} open={i === defaultOpen} className="group rounded-xl bg-white px-5 py-4 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
            {it.q}
            <span className="text-xl leading-none text-brand-700 transition group-open:rotate-45">+</span>
          </summary>
          <p className="mt-2.5 text-[0.93rem] text-ink-600">{it.a}</p>
        </details>
      ))}
    </div>
  );
}
