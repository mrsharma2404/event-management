'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { usePackageFilters } from '@/hooks/usePackageFilters';
import { useSearchPackagesQuery } from '@/store/api';
import { BUDGETS, GUEST_BUCKETS, SORTS, getCategory, getDestination, listingTitle } from '@/lib/catalog';
import type { EventPackage, PackageFilters, SortKey } from '@/types';
import { track } from '@/lib/analytics/client';
import { FilterSidebar } from './FilterSidebar';
import { PackageCard } from './PackageCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton } from '@/components/ui/misc';
import { EnquireButton } from '@/components/enquiry/EnquireButton';
import { cn } from '@/lib/cn';

const FILTER_KEYS = ['categories', 'destinations', 'budget', 'guests', 'minRating', 'instantOnly'] as const;

interface Props {
  /** Server-rendered results for the initial URL, so the first paint has content. */
  initialItems: EventPackage[];
  initialQuery: string;
}

export function PackagesExplorer({ initialItems, initialQuery }: Props) {
  const { filters, queryString, setFilters, reset } = usePackageFilters();
  const [mobileFilters, setMobileFilters] = useState(false);
  const [search, setSearch] = useState(filters.q);

  const { data, isFetching } = useSearchPackagesQuery(queryString, { skip: queryString === initialQuery && !!initialItems });
  const items = queryString === initialQuery ? initialItems : data?.items;

  // Debounce free-text search into the URL.
  useEffect(() => {
    if (search === filters.q) return;
    const t = setTimeout(() => setFilters({ q: search }), 350);
    return () => clearTimeout(t);
  }, [search, filters.q, setFilters]);

  useEffect(() => {
    document.body.style.overflow = mobileFilters ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileFilters]);

  const pills = [
    ...filters.categories.map(v => ({ label: getCategory(v)!.name, clear: () => setFilters(f => ({ categories: f.categories.filter(x => x !== v) })) })),
    ...filters.destinations.map(v => ({ label: getDestination(v)!.name, clear: () => setFilters(f => ({ destinations: f.destinations.filter(x => x !== v) })) })),
    filters.budget && { label: BUDGETS.find(b => b.value === filters.budget)!.label, clear: () => setFilters({ budget: '' }) },
    filters.guests && { label: GUEST_BUCKETS.find(b => b.value === filters.guests)!.label, clear: () => setFilters({ guests: '' }) },
    filters.minRating > 0 && { label: `${filters.minRating}★ & above`, clear: () => setFilters({ minRating: 0 }) },
    filters.instantOnly && { label: 'Instant booking', clear: () => setFilters({ instantOnly: false }) },
    filters.q && { label: `“${filters.q}”`, clear: () => { setSearch(''); setFilters({ q: '' }); } },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const loading = !items || isFetching;

  // Analytics: one round of events per settled result set (first load, then each search / filter / sort change).
  const tracked = useRef<{ qs: string; filters: PackageFilters } | null>(null);
  useEffect(() => {
    if (!items || isFetching || tracked.current?.qs === queryString) return;
    const prev = tracked.current?.filters;
    tracked.current = { qs: queryString, filters };
    const base = {
      result_count: items.length,
      filters_applied: pills.length,
      category: filters.categories.join(',') || undefined,
      location: filters.destinations.join(',') || undefined,
      price_range: filters.budget || undefined,
    };
    if (filters.q && filters.q !== prev?.q) track('search_performed', { ...base, query: filters.q, source: prev ? 'listing' : 'url' });
    if (prev && filters.sort !== prev.sort) track('sort_applied', { ...base, sort: filters.sort });
    if (prev) {
      for (const k of FILTER_KEYS) {
        if (String(filters[k]) !== String(prev[k])) track('filter_applied', { ...base, filter_name: k, filter_value: String(filters[k]) });
      }
    }
    if (!items.length) track('search_result_zero_results', { ...base, query: filters.q || undefined });
    track('listing_result_viewed', { ...base, list: 'packages', package_slugs: items.slice(0, 12).map(p => p.slug) });
  }, [items, isFetching, queryString, filters, pills.length]);

  return (
    <>
    <div className="pb-5 pt-3">
      <h1 className="font-serif text-[clamp(1.6rem,3vw,2.3rem)] font-bold">{listingTitle(filters)}</h1>
      <p className="text-ink-400">Compare curated packages with transparent pricing — book instantly or request a custom quote.</p>
    </div>
    <div className="grid items-start gap-7 pb-16 lg:grid-cols-[270px_minmax(0,1fr)]">
      <FilterSidebar filters={filters} onChange={setFilters} onReset={() => { setSearch(''); reset(); }} open={mobileFilters} onClose={() => setMobileFilters(false)} />

      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search packages, cities, themes…" aria-label="Search packages"
              className="w-full rounded-full border-[1.5px] border-line bg-white py-2.5 pl-10 pr-4 focus:border-brand-600 focus:outline-none" />
          </div>
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setMobileFilters(true)}>
            <SlidersHorizontal className="h-4 w-4" /> Filters{pills.length ? ` (${pills.length})` : ''}
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-ink-400">Sort</span>
            <select value={filters.sort} onChange={e => setFilters({ sort: e.target.value as SortKey })}
              className="rounded-[10px] border-[1.5px] border-line bg-white px-3 py-2 focus:border-brand-600 focus:outline-none">
              {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <strong className="mr-2 text-sm" aria-live="polite">{items ? `${items.length} package${items.length === 1 ? '' : 's'} found` : 'Searching…'}</strong>
          {pills.map(p => (
            <button key={p.label} onClick={p.clear} className="flex items-center gap-1 rounded-full bg-cream-100 px-3 py-1.5 text-xs font-medium hover:bg-cream-200">
              {p.label} <X className="h-3 w-3 text-brand-700" />
            </button>
          ))}
        </div>

        <div className={cn('grid gap-5 sm:grid-cols-2 xl:grid-cols-3', isFetching && 'opacity-60 transition-opacity')}>
          {loading && !items ? (
            Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[380px]" />)
          ) : items!.length === 0 ? (
            <EmptyState icon={<Search className="h-7 w-7" />} title="No exact matches"
              description="Our planners can still make it happen. Tell us what you need and get a custom quote."
              action={<EnquireButton context={{ category: filters.categories[0], destination: filters.destinations[0], source: 'listing-empty' }}>Get a Custom Quote</EnquireButton>} />
          ) : (
            items!.map((p, i) => (
              <Fragment key={p.slug}>
                <PackageCard pkg={p} priority={i < 3} position={i + 1} list="packages" />
                {i === 5 && items!.length > 6 && (
                  <div className="col-span-full flex flex-wrap items-center justify-between gap-4 rounded-[14px] bg-gradient-to-r from-cream-100 to-cream-200 px-6 py-5">
                    <div>
                      <h3 className="font-serif text-lg font-bold">Can’t decide? Let a planner shortlist for you.</h3>
                      <p className="text-sm text-ink-600">Free, no-obligation — 3 options in your budget within 2 hours.</p>
                    </div>
                    <EnquireButton context={{ category: filters.categories[0], destination: filters.destinations[0], source: 'listing-banner' }}>Get Free Shortlist</EnquireButton>
                  </div>
                )}
              </Fragment>
            ))
          )}
        </div>
      </div>
    </div>
    </>
  );
}
