'use client';

import Link from 'next/link';
import { MapPin, Timer } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { selectDraftPackage, selectDraftQuote } from '@/store/selectors';
import { getDestination } from '@/lib/catalog';
import { formatDate, inr } from '@/lib/format';
import { SmartImage } from '@/components/ui/SmartImage';
import { CouponInput } from './CouponInput';

export function OrderSummary({ withCoupon, due }: { withCoupon?: boolean; due?: { label: string; amount: number } }) {
  const draft = useAppSelector(s => s.bookingDraft);
  const pkg = useAppSelector(selectDraftPackage);
  const q = useAppSelector(selectDraftQuote);
  if (!pkg || !q) return null;
  const dest = getDestination(pkg.destination)!;
  const row = 'flex justify-between gap-3 py-1';

  return (
    <aside className="lg:sticky lg:top-[92px]">
      <div className="overflow-hidden rounded-xl2 bg-white shadow-card">
        <div className="flex gap-3.5 border-b border-line p-4">
          <div className="relative h-20 w-20 flex-none overflow-hidden rounded-xl"><SmartImage photo={pkg.images[0]} width={200} fill sizes="80px" alt="" /></div>
          <div className="min-w-0">
            <h4 className="font-sans text-[0.95rem] font-semibold leading-snug">{pkg.title}</h4>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-400"><MapPin className="h-3 w-3" />{dest.name} · {pkg.duration}</div>
            <Link href={`/packages/${pkg.slug}`} className="text-xs font-semibold text-brand-700">Change package</Link>
          </div>
        </div>
        <div className="p-4 text-[0.9rem]">
          <div className={row}><span className="text-ink-600">Package</span><strong>{q.tier.name}</strong></div>
          <div className={row}><span className="text-ink-600">Date</span><strong>{formatDate(draft.date)}</strong></div>
          <div className={row}><span className="text-ink-600">Guests</span><strong>{q.guests}</strong></div>
          <hr className="my-3 border-line" />
          <div className={row}><span className="text-ink-600">{q.tier.name} package</span><span>{inr(q.tier.price)}</span></div>
          {q.extraGuestsCost > 0 && <div className={row}><span className="text-ink-600">{q.extraGuests} extra guests</span><span>{inr(q.extraGuestsCost)}</span></div>}
          {q.addons.map(a => <div key={a.key} className={row}><span className="text-ink-600">{a.name}</span><span>{inr(a.price)}</span></div>)}
          {q.discount > 0 && <div className={`${row} text-success`}><span>Coupon {draft.coupon}</span><span>−{inr(q.discount)}</span></div>}
          <div className={row}><span className="text-ink-600">GST (18%)</span><span>{inr(q.gst)}</span></div>
          <div className={`${row} mt-1.5 border-t border-dashed border-line pt-2.5 text-base font-bold`}><span>Total amount</span><span>{inr(q.total)}</span></div>
          {withCoupon && <CouponInput />}
        </div>
        <div className="flex items-center justify-between bg-cream px-4 py-4">
          <span className="text-sm">{due?.label ?? 'Pay now to reserve (20%)'}</span>
          <strong className="text-2xl font-bold text-brand-700">{inr(due?.amount ?? q.advance)}</strong>
        </div>
      </div>
      <div className="mt-3.5 flex items-center gap-3 rounded-xl bg-cream-100 p-4 text-sm">
        <Timer className="h-5 w-5 flex-none text-brand-700" />
        <span>Your date is held for <strong>15 minutes</strong> while you complete booking.</span>
      </div>
    </aside>
  );
}
