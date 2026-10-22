'use client';

import { Check } from 'lucide-react';
import { useSelection } from './SelectionContext';
import { inr } from '@/lib/format';
import { cn } from '@/lib/cn';

export function TierSelector() {
  const { pkg, tier, setTier } = useSelection();
  return (
    <div role="radiogroup" aria-label="Package tier" className="grid gap-3.5 md:grid-cols-3">
      {pkg.tiers.map(t => {
        const selected = t.key === tier;
        return (
          <button key={t.key} type="button" role="radio" aria-checked={selected} onClick={() => setTier(t.key)}
            className={cn('relative rounded-[14px] border-2 bg-white p-5 text-left transition hover:border-gold',
              selected ? 'border-brand-600 bg-brand-50' : 'border-line')}>
            {selected && <span className="absolute right-3.5 top-3.5 grid h-6 w-6 place-items-center rounded-full bg-brand text-ink"><Check className="h-3.5 w-3.5" /></span>}
            {t.key === 'premium' && <span className="mb-2 inline-block rounded bg-gold/15 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-gold-700">Most popular</span>}
            <h4 className="font-sans text-base font-bold">{t.name}</h4>
            <strong className="my-1.5 block text-xl">{inr(t.price)}</strong>
            <p className="mb-3 text-sm text-ink-400">{t.description}</p>
            <ul className="space-y-1 text-sm text-ink-600">
              {t.perks.map(p => <li key={p} className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 flex-none text-success" />{p}</li>)}
            </ul>
          </button>
        );
      })}
    </div>
  );
}
