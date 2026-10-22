'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ShieldCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDraftQuote } from '@/store/selectors';
import { setPaymentMethod, setPaymentMode } from '@/store/slices/bookingDraftSlice';
import { bookingCreated } from '@/store/slices/accountSlice';
import { showToast } from '@/store/slices/uiSlice';
import { useCreateBookingMutation } from '@/store/api';
import { balanceDueDate } from '@/lib/pricing';
import { formatDate, inr } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { OrderSummary } from './OrderSummary';
import { PaymentMethods, type PaymentMethodsHandle } from './PaymentMethods';
import { cn } from '@/lib/cn';
import { track } from '@/lib/analytics/client';
import { useTrackView } from '@/hooks/useTrackView';

type ApiError = { status?: number | string; data?: { message?: string } };

export function PaymentPanel() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const draft = useAppSelector(s => s.bookingDraft);
  const q = useAppSelector(selectDraftQuote)!;
  const methodsRef = useRef<PaymentMethodsHandle>(null);
  const [createBooking] = useCreateBookingMutation();
  const [processing, setProcessing] = useState(false);
  const contact = draft.contact!;

  const due = draft.paymentMode === 'advance' ? q.advance : q.fullPayment;
  const payProps = {
    package_slug: draft.packageSlug, tier: draft.tier, quantity: draft.guests, event_date: draft.date, value: q.total, amount: due,
    currency: 'INR', payment_mode: draft.paymentMode, payment_method: draft.paymentMethod, coupon: draft.coupon, current_step: 'payment',
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  useEffect(() => track('safe_checkout_viewed', payProps), []);
  const badgeRef = useTrackView<HTMLParagraphElement>('secure_payment_badge_viewed', { current_step: 'payment' });

  const pay = async () => {
    if (!methodsRef.current?.validate()) {
      track('form_error', { ...payProps, form: 'payment_method' });
      return;
    }
    track('payment_initiated', payProps);
    setProcessing(true);
    try {
      // Simulated gateway latency — replace with Razorpay/Stripe checkout + server-side verification.
      await new Promise(r => setTimeout(r, 1400));
      const booking = await createBooking({
        packageSlug: draft.packageSlug!, tier: draft.tier, date: draft.date, guests: draft.guests, addons: draft.addons,
        coupon: draft.coupon, contact, event: draft.event!, paymentMode: draft.paymentMode, paymentMethod: draft.paymentMethod,
      }).unwrap();
      track('payment_success', { ...payProps, booking_id: booking.id, amount: booking.amountPaid });
      track('booking_success', { ...payProps, booking_id: booking.id, value: booking.quote.total });
      dispatch(bookingCreated(booking.id));
      // The draft is cleared on the confirmation page, so this page doesn't flash an empty state.
      router.replace(`/checkout/confirmation/${booking.id}`);
    } catch (err) {
      setProcessing(false);
      const { status, data } = err as ApiError;
      const failure = { ...payProps, error_code: String(status ?? 'unknown'), error_message: data?.message?.slice(0, 200) };
      track('payment_failed', failure);
      track('booking_failed', failure);
      track('checkout_error', failure);
      // A 400 is our own validation rejecting the booking; anything else is the payment/booking backend failing.
      if (status !== 400) track('failed_payment_gateway', failure);
      dispatch(showToast(data?.message ?? 'Payment failed. You have not been charged — please try again.', 'error'));
    }
  };

  const option = (mode: 'advance' | 'full', title: React.ReactNode, sub: string, amount: number) => (
    <label className={cn('flex cursor-pointer items-start gap-3.5 rounded-[14px] border-2 p-4 transition', draft.paymentMode === mode ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-gold')}>
      <input type="radio" name="paymode" checked={draft.paymentMode === mode} onChange={() => dispatch(setPaymentMode(mode))} className="mt-1 h-[18px] w-[18px] accent-brand-700" />
      <span className="flex-1"><strong className="block">{title}</strong><span className="text-sm text-ink-400">{sub}</span></span>
      <span className="text-xl font-bold">{inr(amount)}</span>
    </label>
  );

  return (
    <div className="grid items-start gap-7 pb-16 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl2 bg-white p-5 shadow-card">
          <div><strong>{contact.name}</strong><div className="text-sm text-ink-400">{contact.phone} · {contact.email}</div></div>
          <Link href="/checkout/booking" className="text-sm font-semibold text-brand-700">Edit details</Link>
        </div>

        <section className="mb-5 rounded-xl2 bg-white p-5 shadow-card sm:p-7">
          <h2 className="mb-5 font-serif text-xl font-bold">How much would you like to pay now?</h2>
          <div className="grid gap-3">
            {option('advance', 'Reserve with 20% advance', `Pay ${inr(q.total - q.advance)} balance by ${formatDate(balanceDueDate(draft.date))}`, q.advance)}
            {option('full', <>Pay in full <span className="ml-1.5 rounded bg-success px-2 py-0.5 text-[0.68rem] font-bold text-white">SAVE {inr(q.total - q.fullPayment)}</span></>,
              'Extra 3% off · nothing more to pay later', q.fullPayment)}
          </div>
        </section>

        <section className="rounded-xl2 bg-white p-5 shadow-card sm:p-7">
          <h2 className="mb-5 font-serif text-xl font-bold">Payment method</h2>
          <PaymentMethods ref={methodsRef} method={draft.paymentMethod} onMethodChange={m => dispatch(setPaymentMethod(m))} amount={due} />
          <Button size="lg" block className="mt-6" onClick={pay} loading={processing}>
            <Lock className="h-4 w-4" /> Pay {inr(due)} securely
          </Button>
          <p ref={badgeRef} className="mt-3 flex items-center justify-center gap-2 text-xs text-ink-400">
            <ShieldCheck className="h-4 w-4" /> 256-bit SSL · PCI-DSS compliant · Demo checkout — no real payment is taken
          </p>
        </section>
      </div>

      <OrderSummary due={{ label: draft.paymentMode === 'advance' ? 'Pay now (20%)' : 'Pay now (full, 3% off)', amount: due }} />

      {processing && (
        <div className="fixed inset-0 z-[130] flex flex-col items-center justify-center gap-4 bg-cream/95 text-center" role="alert" aria-busy="true">
          <span className="h-14 w-14 animate-spin rounded-full border-[5px] border-cream-200 border-t-brand" />
          <h3 className="font-serif text-2xl font-bold">Processing your payment…</h3>
          <p className="text-ink-400">Please don’t close or refresh this page.</p>
        </div>
      )}
    </div>
  );
}
