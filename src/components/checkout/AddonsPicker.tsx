'use client';

import { addons } from '@/lib/data/addons';
import { inr } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleAddon } from '@/store/slices/bookingDraftSlice';
import { cn } from '@/lib/cn';

export function AddonsPicker() {
  const dispatch = useAppDispatch();
  const selected = useAppSelector(s => s.bookingDraft.addons);
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {addons.map(a => {
        const on = selected.includes(a.key);
        return (
          <label key={a.key} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-3 transition', on ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-gold')}>
            <input type="checkbox" checked={on} onChange={() => dispatch(toggleAddon(a.key))} className="h-[18px] w-[18px] accent-brand-700" />
            <span className="flex-1">
              <span className="block text-sm font-semibold">{a.name}</span>
              <span className="block text-xs text-ink-400">{a.description}</span>
            </span>
            <strong className="text-sm text-brand-700">+{inr(a.price)}</strong>
          </label>
        );
      })}
    </div>
  );
}
