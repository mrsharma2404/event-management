'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { EventPackage, Quote, TierKey } from '@/types';
import { quote } from '@/lib/pricing';
import { useAppSelector } from '@/store/hooks';
import { track } from '@/lib/analytics/client';

interface Selection {
  pkg: EventPackage;
  tier: TierKey;
  setTier: (t: TierKey) => void;
  date: string;
  setDate: (d: string) => void;
  guests: number;
  setGuests: (n: number) => void;
  quote: Quote;
}

const Ctx = createContext<Selection | null>(null);

/** Local selection shared by the tier cards, booking widget and mobile bar on a package page. */
export function SelectionProvider({ pkg, children }: { pkg: EventPackage; children: React.ReactNode }) {
  const draft = useAppSelector(s => s.bookingDraft);
  const hydrated = useAppSelector(s => s.ui.hydrated);
  const [tier, setTier] = useState<TierKey>('classic');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState(pkg.guests.included);

  // Resume an in-progress booking for this package once localStorage has loaded.
  const resumed = useRef(false);
  useEffect(() => {
    if (!hydrated || resumed.current) return;
    resumed.current = true;
    if (draft.packageSlug === pkg.slug) {
      setTier(draft.tier);
      setDate(draft.date);
      setGuests(draft.guests);
      track('session_recovered', { source: 'booking_draft', tier: draft.tier, event_date: draft.date, quantity: draft.guests, has_contact: !!draft.contact });
    }
  }, [hydrated, draft, pkg.slug]);
  const q = useMemo(() => quote(pkg, { tier, guests }), [pkg, tier, guests]);

  // User-driven changes are tracked here, so the tier cards, widget and mobile bar all report the same way.
  const selectTier = useCallback((t: TierKey) => {
    setTier(t);
    const info = pkg.tiers.find(x => x.key === t);
    track('ticket_option_selected', { tier: t, tier_name: info?.name, tier_price: info?.price, currency: 'INR' });
  }, [pkg]);
  const selectDate = useCallback((d: string) => {
    setDate(d);
    if (d) track('date_selected', { event_date: d, days_ahead: Math.round((Date.parse(d) - Date.now()) / 86_400_000) });
  }, []);
  const guestsEdited = useRef(false);
  const selectGuests = useCallback((n: number) => { guestsEdited.current = true; setGuests(n); }, []);
  // Guest counts are typed digit by digit: report the settled value.
  useEffect(() => {
    if (!guestsEdited.current) return;
    const t = setTimeout(() => track('ticket_quantity_updated', { quantity: guests, tier }), 800);
    return () => clearTimeout(t);
  }, [guests, tier]);

  return (
    <Ctx.Provider value={{ pkg, tier, setTier: selectTier, date, setDate: selectDate, guests, setGuests: selectGuests, quote: q }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSelection must be used inside <SelectionProvider>');
  return ctx;
}
