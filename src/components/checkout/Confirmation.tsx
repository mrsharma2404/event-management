'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Check, Download, SearchX } from 'lucide-react';
import { useGetBookingQuery } from '@/store/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearDraft } from '@/store/slices/bookingDraftSlice';
import { formatDate, inr } from '@/lib/format';
import { EmptyState, Skeleton } from '@/components/ui/misc';
import { Button, ButtonLink } from '@/components/ui/Button';
import { trackOnce, track } from '@/lib/analytics/client';

const METHOD_LABEL = { upi: 'UPI', card: 'Card', netbanking: 'Net banking', emi: 'EMI' } as const;

export function Confirmation({ id }: { id: string }) {
  const dispatch = useAppDispatch();
  const { data: b, isLoading, isError } = useGetBookingQuery(id);
  const hydrated = useAppSelector(s => s.ui.hydrated);
  const draftSlug = useAppSelector(s => s.bookingDraft.packageSlug);

  useEffect(() => {
    if (hydrated && b && draftSlug === b.packageSlug) dispatch(clearDraft());
  }, [hydrated, b, draftSlug, dispatch]);

  useEffect(() => {
    if (!b) return;
    trackOnce(`confirmation:${b.id}`, 'order_confirmation_viewed', {
      booking_id: b.id, package_slug: b.packageSlug, tier: b.tier, value: b.quote.total, amount_paid: b.amountPaid, currency: 'INR',
    });
  }, [b]);

  if (isLoading) return <Skeleton className="mx-auto mb-16 h-[520px] max-w-3xl" />;
  if (isError || !b) {
    return (
      <div className="pb-16">
        <EmptyState icon={<SearchX className="h-7 w-7" />} title="Booking not found"
          description="We couldn’t find this booking. If you just paid, check your email for the confirmation or contact support."
          action={<ButtonLink href="/account">Go to my bookings</ButtonLink>} />
      </div>
    );
  }

  const cell = (label: string, value: React.ReactNode) => (
    <div><span className="block text-xs text-ink-400">{label}</span><strong>{value}</strong></div>
  );

  return (
    <div className="mx-auto mb-16 max-w-3xl overflow-hidden rounded-xl2 bg-white shadow-card">
      <div className="bg-gradient-to-r from-brand to-brand-600 px-6 py-10 text-center text-ink">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-ink text-brand"><Check className="h-8 w-8" /></div>
        <h1 className="font-serif text-3xl font-bold">Your date is locked in! 🎉</h1>
        <p className="mt-1 text-ink-600">Booking ID <strong>{b.id}</strong> · confirmation sent to {b.contact.email}</p>
      </div>
      <div className="p-6 sm:p-8">
        <h2 className="mb-5 font-serif text-xl font-bold">{b.packageTitle}</h2>
        <div className="mb-6 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          {cell('Event date', formatDate(b.date))}
          {cell('Location', b.destinationName)}
          {cell('Package', `${b.quote.tier.name} · ${b.guests} guests`)}
          {cell(`Paid via ${METHOD_LABEL[b.paymentMethod]}`, <span className="text-success">{inr(b.amountPaid)}</span>)}
          {cell('Total', inr(b.paymentMode === 'full' ? b.amountPaid : b.quote.total))}
          {cell('Balance', b.balance ? `${inr(b.balance)} due by ${formatDate(b.balanceDueDate)}` : 'Fully paid ✓')}
          {b.quote.addons.length > 0 && cell('Add-ons', b.quote.addons.map(a => a.name).join(', '))}
          {b.coupon && cell('Coupon', `${b.coupon} (−${inr(b.quote.discount)})`)}
        </div>
        <div className="rounded-xl bg-cream p-5">
          <strong>What happens next</strong>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
            <li>Your dedicated planner will call you within 24 hours{b.contact.whatsapp ? ' and add you to a WhatsApp group' : ''}.</li>
            <li>We’ll share a mood board and vendor line-up for your approval.</li>
            <li>Final guest count is due 7 days before the event.</li>
          </ol>
        </div>
        <div className="mt-6 flex flex-wrap gap-3" data-no-print>
          <Button variant="outline" onClick={() => { track('booking_receipt_downloaded', { booking_id: b.id, package_slug: b.packageSlug }); window.print(); }}><Download className="h-4 w-4" /> Download receipt</Button>
          <ButtonLink href="/account">View my bookings</ButtonLink>
          <Link href="/" className="self-center text-sm font-semibold text-brand-700">Back to home</Link>
        </div>
      </div>
    </div>
  );
}
