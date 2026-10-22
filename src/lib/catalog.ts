import type { CategorySlug, EventPackage, PackageFilters, SortKey } from '@/types';
import { packages } from './data/packages';
import { categories } from './data/categories';
import { destinations } from './data/destinations';

export { packages, categories, destinations };

export const getCategory = (slug: string) => categories.find(c => c.slug === slug);
export const getDestination = (slug: string) => destinations.find(d => d.slug === slug);
export const getPackage = (slug: string) => packages.find(p => p.slug === slug);

export const BUDGETS = [
  { value: '0-50000', label: 'Under ₹50K' },
  { value: '50000-200000', label: '₹50K – ₹2 L' },
  { value: '200000-800000', label: '₹2 L – ₹8 L' },
  { value: '800000-', label: '₹8 L+' },
] as const;

export const GUEST_BUCKETS = [
  { value: 'couple', label: 'Just us two', range: [2, 2] },
  { value: '3-50', label: 'Up to 50', range: [3, 50] },
  { value: '51-150', label: '50 – 150', range: [51, 150] },
  { value: '151-400', label: '150 – 400', range: [151, 400] },
  { value: '401-', label: '400+', range: [401, Infinity] },
] as const;

export const SORTS: { value: SortKey; label: string }[] = [
  { value: 'popular', label: 'Popularity' },
  { value: 'rating', label: 'Rating' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'discount', label: 'Biggest discount' },
];

export const DEFAULT_FILTERS: PackageFilters = {
  categories: [], destinations: [], budget: '', guests: '', minRating: 0, instantOnly: false, sort: 'popular', q: '',
};

/** URL <-> filter state. Keeps listing pages shareable and SSR-friendly. */
export function filtersFromParams(sp: URLSearchParams | Record<string, string | string[] | undefined>): PackageFilters {
  const get = (k: string) => {
    const v = sp instanceof URLSearchParams ? sp.get(k) : sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? '';
  };
  const list = (k: string) => get(k).split(',').filter(Boolean);
  const sort = get('sort') as SortKey;
  return {
    categories: list('category').filter(c => getCategory(c)) as CategorySlug[],
    destinations: list('destination').filter(d => getDestination(d)),
    budget: BUDGETS.some(b => b.value === get('budget')) ? get('budget') : '',
    guests: GUEST_BUCKETS.some(b => b.value === get('guests')) ? get('guests') : '',
    minRating: Number(get('rating')) || 0,
    instantOnly: get('instant') === '1',
    sort: SORTS.some(s => s.value === sort) ? sort : 'popular',
    q: get('q'),
  };
}

export function filtersToParams(f: PackageFilters) {
  const p = new URLSearchParams();
  if (f.categories.length) p.set('category', f.categories.join(','));
  if (f.destinations.length) p.set('destination', f.destinations.join(','));
  if (f.budget) p.set('budget', f.budget);
  if (f.guests) p.set('guests', f.guests);
  if (f.minRating) p.set('rating', String(f.minRating));
  if (f.instantOnly) p.set('instant', '1');
  if (f.sort !== 'popular') p.set('sort', f.sort);
  if (f.q) p.set('q', f.q);
  return p;
}

const parseRange = (v: string): [number, number] => {
  const [lo, hi] = v.split('-');
  return [Number(lo) || 0, hi ? Number(hi) : Infinity];
};

export function searchPackages(f: PackageFilters, source: EventPackage[] = packages): EventPackage[] {
  const q = f.q.trim().toLowerCase();
  const list = source.filter(p => {
    if (f.categories.length && !f.categories.includes(p.category)) return false;
    if (f.destinations.length && !f.destinations.includes(p.destination)) return false;
    if (f.budget) {
      const [lo, hi] = parseRange(f.budget);
      if (p.price < lo || p.price > hi) return false;
    }
    if (f.guests) {
      const bucket = GUEST_BUCKETS.find(b => b.value === f.guests)!;
      const [lo, hi] = bucket.range;
      if (p.guests.max < lo || p.guests.min > hi) return false;
    }
    if (f.minRating && p.rating < f.minRating) return false;
    if (f.instantOnly && p.enquiryFirst) return false;
    if (q) {
      const hay = [p.title, getCategory(p.category)?.name, getDestination(p.destination)?.name, ...p.highlights].join(' ').toLowerCase();
      if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
    }
    return true;
  });
  const discount = (p: EventPackage) => (p.mrp - p.price) / p.mrp;
  const sorters: Record<SortKey, (a: EventPackage, b: EventPackage) => number> = {
    popular: (a, b) => b.reviewCount - a.reviewCount,
    rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    discount: (a, b) => discount(b) - discount(a),
  };
  return [...list].sort(sorters[f.sort]);
}

export function relatedPackages(pkg: EventPackage, limit = 4) {
  return packages
    .filter(p => p.slug !== pkg.slug && (p.category === pkg.category || p.destination === pkg.destination))
    .sort((a, b) => Number(b.category === pkg.category) - Number(a.category === pkg.category) || b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

export function collectionStats(list: EventPackage[]) {
  if (!list.length) return { count: 0, minPrice: 0, avgRating: 0, reviews: 0 };
  return {
    count: list.length,
    minPrice: Math.min(...list.map(p => p.price)),
    avgRating: +(list.reduce((s, p) => s + p.rating, 0) / list.length).toFixed(1),
    reviews: list.reduce((s, p) => s + p.reviewCount, 0),
  };
}

export function listingTitle(f: PackageFilters) {
  const c = f.categories.length === 1 ? getCategory(f.categories[0]) : undefined;
  const d = f.destinations.length === 1 ? getDestination(f.destinations[0]) : undefined;
  if (c && d) return `${c.name} in ${d.name}`;
  if (c) return `${c.name} Packages`;
  if (d) return `Event Packages in ${d.name}`;
  return 'All Event Packages';
}
