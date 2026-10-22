'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, Headphones, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useSelection } from './SelectionContext';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { discountPercent, inr, minEventDate } from '@/lib/format';
import { useAppDispatch } from '@/store/hooks';
import { startDraft } from '@/store/slices/bookingDraftSlice';
import { openEnquiry } from '@/store/slices/uiSlice';
import type { TierKey } from '@/types';
import { track } from '@/lib/analytics/client';
import { useTrackView } from '@/hooks/useTrackView';

export function PriceBreakdown({ className }: { className?: string }) {
  const { quote: q } = useSelection();
  const ref = useTrackView<HTMLDivElement>('price_breakdown_viewed', { tier: q.tier.key, value: q.total, currency: 'INR' });
  const row = 'flex justify-between py-0.5';
  return (
    <div ref={ref} className={className}>
      <div className={row}><span>{q.tier.name} package</span><span>{inr(q.tier.price)}</span></div>
      {q.extraGuestsCost > 0 && <div className={row}><span>{q.extraGuests} extra guests</span><span>{inr(q.extraGuestsCost)}</span></div>}
      <div className={row}><span>GST (18%)</span><span>{inr(q.gst)}</span></div>
      <div className={`${row} mt-1.5 border-t border-dashed border-line pt-2.5 text-base font-bold`}><span>Total</span><span>{inr(q.total)}</span></div>
      <div className={`${row} font-semibold text-success`}><span>Pay now to reserve (20%)</span><span>{inr(q.advance)}</span></div>
    </div>
  );
}

export function BookingWidget() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { pkg, tier, setTier, date, setDate, guests, setGuests, quote: q } = useSelection();
  const [errors, setErrors] = useState<{ date?: string; guests?: string }>({});
  const couple = pkg.guests.min === 2 && pkg.guests.max === 2;
  const min = minEventDate();

  const book = () => {
    const e: typeof errors = {};
    if (!date) e.date = 'Pick your event date';
    else if (date < min) e.date = 'Earliest date is 7 days from today';
    if (!(guests >= pkg.guests.min && guests <= pkg.guests.max)) e.guests = `${pkg.guests.min}–${pkg.guests.max} guests`;
    setErrors(e);
    if (Object.keys(e).length) {
      track('booking_form_validation_failed', { step: 'package_widget', fields: Object.keys(e) });
      return;
    }
    track('checkout_started', { tier, event_date: date, quantity: guests, value: q.total, currency: 'INR' });
    dispatch(startDraft({ packageSlug: pkg.slug, tier, date, guests }));
    router.push('/checkout/booking');
  };

  const enquire = () => dispatch(openEnquiry({ packageSlug: pkg.slug, date, guests, source: 'package-widget' }));

  return (
    <div id="book" className="scroll-mt-28">
      <div className="rounded-xl2 bg-white p-6 shadow-card">
        <span className="text-sm text-ink-400">Starting from</span>
        <div className="flex flex-wrap items-baseline gap-2.5">
          <strong className="text-3xl font-bold tracking-tight">{inr(pkg.price)}</strong>
          <s className="text-ink-400">{inr(pkg.mrp)}</s>
          <span className="text-sm font-bold text-success">{discountPercent(pkg.price, pkg.mrp)}% off</span>
        </div>
        <span className="text-xs text-ink-400">+ GST · {couple ? 'per couple' : `for ${pkg.guests.included} guests`}</span>

        <div className="mt-5">
          <Field label="Package" htmlFor="bw-tier">
            <Select id="bw-tier" value={tier} onChange={e => setTier(e.target.value as TierKey)}>
              {pkg.tiers.map(t => <option key={t.key} value={t.key}>{t.name} — {inr(t.price)}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Event date" htmlFor="bw-date" error={errors.date}>
              <Input id="bw-date" type="date" min={min} value={date} aria-invalid={!!errors.date} onChange={e => setDate(e.target.value)} />
            </Field>
            <Field label="Guests" htmlFor="bw-guests" error={errors.guests} hint={couple ? undefined : `${pkg.guests.min}–${pkg.guests.max}`}>
              <Input id="bw-guests" type="number" min={pkg.guests.min} max={pkg.guests.max} value={guests || ''} readOnly={couple}
                aria-invalid={!!errors.guests} onChange={e => setGuests(Number(e.target.value))} />
            </Field>
          </div>
        </div>

        <PriceBreakdown className="mb-4 rounded-xl bg-cream p-3.5 text-sm" />

        <div className="grid gap-2.5">
          {pkg.enquiryFirst ? (
            <>
              <Button size="lg" onClick={enquire}>Get a Custom Quote</Button>
              <span className="text-center text-xs text-ink-400">or</span>
              <Button variant="outline" onClick={book}>Reserve with 20% advance</Button>
            </>
          ) : (
            <>
              <Button size="lg" onClick={book}>Book Now</Button>
              <span className="text-center text-xs text-ink-400">or</span>
              <Button variant="outline" onClick={enquire}>Send Enquiry</Button>
            </>
          )}
        </div>

        <ul className="mt-5 space-y-2 text-[0.82rem] text-ink-600">
          <li className="flex gap-2"><CalendarCheck className="h-4 w-4 text-success" /> Pay only 20% to block your date</li>
          <li className="flex gap-2"><RefreshCcw className="h-4 w-4 text-success" /> Free date change up to 30 days before</li>
          <li className="flex gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Crown & Co. Event Protection included</li>
        </ul>
      </div>
      <a href="tel:+919876543210" className="mt-3.5 flex items-center gap-3 rounded-xl bg-cream-100 p-4 text-sm">
        <Headphones className="h-5 w-5 text-brand-700" />
        <span><strong>Questions?</strong> Talk to an expert<br /><span className="font-semibold text-brand-700">+91 98765 43210</span></span>
      </a>
    </div>
  );
}

export function MobileBookingBar() {
  const { pkg, quote: q } = useSelection();
  const dispatch = useAppDispatch();
  return (
    <div data-mobile-bar className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-line bg-white px-4 py-2.5 shadow-[0_-6px_20px_rgba(0,0,0,.08)] lg:hidden">
      <div className="flex-1 leading-tight">
        <span className="text-xs text-ink-400">{q.tier.name} · total</span>
        <strong className="block">{inr(q.total)}</strong>
      </div>
      <Button size="sm" variant="outline" onClick={() => dispatch(openEnquiry({ packageSlug: pkg.slug, source: 'mobile-bar' }))}>Enquire</Button>
      <a href="#book" className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-ink">{pkg.enquiryFirst ? 'Reserve' : 'Book Now'}</a>
    </div>
  );
}
