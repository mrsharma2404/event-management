'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { GUEST_BUCKETS, categories, destinations } from '@/lib/catalog';
import { track } from '@/lib/analytics/client';

const cell = 'flex flex-col rounded-[14px] px-4 py-2 transition hover:bg-cream';
const lbl = 'text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-ink-400';
const ctl = 'w-full cursor-pointer bg-transparent py-1 font-semibold text-ink outline-none';

export function HeroSearch() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [destination, setDestination] = useState('');
  const [guests, setGuests] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (category) p.set('category', category);
    if (destination) p.set('destination', destination);
    if (guests) p.set('guests', guests);
    track('search_performed', { source: 'hero', category: category || undefined, location: destination || undefined, guests: guests || undefined, filters_applied: p.size });
    router.push(`/packages${p.size ? `?${p}` : ''}`);
  };

  return (
    <form onSubmit={submit} className="mt-8 grid max-w-[920px] gap-1.5 rounded-[20px] bg-white p-2.5 text-ink shadow-lift sm:grid-cols-2 lg:grid-cols-[1.1fr_1.1fr_1fr_auto]">
      <label className={cell}><span className={lbl}>Occasion</span>
        <select className={ctl} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All occasions</option>
          {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </label>
      <label className={cell}><span className={lbl}>Destination</span>
        <select className={ctl} value={destination} onChange={e => setDestination(e.target.value)}>
          <option value="">Anywhere</option>
          {destinations.map(d => <option key={d.slug} value={d.slug}>{d.name}</option>)}
        </select>
      </label>
      <label className={cell}><span className={lbl}>Guests</span>
        <select className={ctl} value={guests} onChange={e => setGuests(e.target.value)}>
          <option value="">Any size</option>
          {GUEST_BUCKETS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
      </label>
      <button type="submit" className="flex items-center justify-center gap-2 rounded-[14px] bg-brand px-8 py-3.5 font-semibold text-ink transition hover:bg-brand-600 sm:col-span-2 lg:col-span-1">
        <Search className="h-4 w-4" /> Explore
      </button>
    </form>
  );
}
