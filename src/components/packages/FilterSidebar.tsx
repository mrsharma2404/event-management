'use client';

import { X } from 'lucide-react';
import { BUDGETS, GUEST_BUCKETS, categories, destinations, packages } from '@/lib/catalog';
import type { CategorySlug, PackageFilters } from '@/types';
import { cn } from '@/lib/cn';

interface Props {
  filters: PackageFilters;
  onChange: (patch: Partial<PackageFilters>) => void;
  onReset: () => void;
  open: boolean;
  onClose: () => void;
  hide?: ('categories' | 'destinations')[];
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

const H = ({ children }: { children: React.ReactNode }) => (
  <h4 className="mb-2.5 mt-5 font-sans text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-ink-600 first:mt-0">{children}</h4>
);
const Row = ({ children }: { children: React.ReactNode }) => (
  <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[0.9rem] hover:text-brand-700">{children}</label>
);
const box = 'h-4 w-4 accent-brand-700';

export function FilterSidebar({ filters, onChange, onReset, open, onClose, hide = [] }: Props) {
  const count = (key: 'category' | 'destination', v: string) => packages.filter(p => p[key] === v).length;
  return (
    <aside
      className={cn(
        'rounded-[14px] bg-white p-5 shadow-card lg:sticky lg:top-[92px] lg:block lg:max-h-[calc(100vh-110px)] lg:overflow-y-auto',
        open ? 'fixed inset-0 z-[90] block overflow-y-auto rounded-none' : 'hidden',
      )}
      aria-label="Filters"
    >
      <div className="mb-3 flex items-center justify-between">
        <strong>Filters</strong>
        <div className="flex items-center gap-3">
          <button onClick={onReset} className="text-sm font-semibold text-brand-700">Clear all</button>
          <button onClick={onClose} className="lg:hidden" aria-label="Close filters"><X className="h-5 w-5" /></button>
        </div>
      </div>

      {!hide.includes('categories') && (
        <>
          <H>Occasion</H>
          {categories.map(c => (
            <Row key={c.slug}>
              <input type="checkbox" className={box} checked={filters.categories.includes(c.slug)}
                onChange={() => onChange({ categories: toggle<CategorySlug>(filters.categories, c.slug) })} />
              {c.name}<span className="ml-auto text-xs text-ink-400">{count('category', c.slug)}</span>
            </Row>
          ))}
        </>
      )}

      {!hide.includes('destinations') && (
        <>
          <H>Destination</H>
          {destinations.map(d => (
            <Row key={d.slug}>
              <input type="checkbox" className={box} checked={filters.destinations.includes(d.slug)}
                onChange={() => onChange({ destinations: toggle(filters.destinations, d.slug) })} />
              {d.name}<span className="ml-auto text-xs text-ink-400">{count('destination', d.slug)}</span>
            </Row>
          ))}
        </>
      )}

      <H>Budget</H>
      <Row><input type="radio" name="budget" className={box} checked={!filters.budget} onChange={() => onChange({ budget: '' })} />Any budget</Row>
      {BUDGETS.map(b => (
        <Row key={b.value}><input type="radio" name="budget" className={box} checked={filters.budget === b.value} onChange={() => onChange({ budget: b.value })} />{b.label}</Row>
      ))}

      <H>Guest count</H>
      <Row><input type="radio" name="guests" className={box} checked={!filters.guests} onChange={() => onChange({ guests: '' })} />Any size</Row>
      {GUEST_BUCKETS.map(b => (
        <Row key={b.value}><input type="radio" name="guests" className={box} checked={filters.guests === b.value} onChange={() => onChange({ guests: b.value })} />{b.label}</Row>
      ))}

      <H>More</H>
      <Row><input type="checkbox" className={box} checked={filters.minRating >= 4.8} onChange={e => onChange({ minRating: e.target.checked ? 4.8 : 0 })} />Rated 4.8 ★ & above</Row>
      <Row><input type="checkbox" className={box} checked={filters.instantOnly} onChange={e => onChange({ instantOnly: e.target.checked })} />Instant booking only</Row>

      <button onClick={onClose} className="mt-6 w-full rounded-full bg-brand py-3 font-semibold text-ink lg:hidden">Show results</button>
    </aside>
  );
}
