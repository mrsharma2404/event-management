'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { bookingDetailsSchema, type BookingDetailsInput, type BookingDetailsValues } from '@/lib/validation';
import { minEventDate } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectDraftPackage } from '@/store/selectors';
import { setDetails, updateSelection } from '@/store/slices/bookingDraftSlice';
import { openEnquiry } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/Field';
import { AddonsPicker } from './AddonsPicker';
import { track } from '@/lib/analytics/client';
import { errorFields, useFormTracking } from '@/hooks/useFormTracking';

const TIMES = ['Morning (8–12)', 'Afternoon (12–4)', 'Evening (4–8)', 'Night (8 onwards)'];
const FOOD = ['Veg & Non-veg', 'Pure veg', 'Jain', 'Not applicable'];

const formStep = (field: string) =>
  field === 'terms' || field.startsWith('contact.gst') || field === 'contact.company' ? 'billing' : field.startsWith('contact.') ? 'contact' : 'event';

function Step({ n, title, children, aside }: { n: number; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="mb-5 rounded-xl2 bg-white p-5 shadow-card sm:p-7">
      <h2 className="mb-5 flex items-center gap-2.5 font-serif text-xl font-bold">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-cream-100 font-sans text-sm text-brand-700">{n}</span>
        {title}
        {aside}
      </h2>
      {children}
    </section>
  );
}

export function BookingDetailsForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const draft = useAppSelector(s => s.bookingDraft);
  const user = useAppSelector(s => s.account.user);
  const pkg = useAppSelector(selectDraftPackage)!;
  const couple = pkg.guests.min === 2 && pkg.guests.max === 2;
  const isWedding = pkg.category.includes('wedding') || couple;

  const {
    register, handleSubmit, watch, setError, formState: { errors, isSubmitting },
  } = useForm<BookingDetailsInput, unknown, BookingDetailsValues>({
    resolver: zodResolver(bookingDetailsSchema),
    defaultValues: {
      contact: draft.contact ?? { name: user?.name ?? '', phone: user?.phone ?? '', email: '', city: '', whatsapp: true, gstInvoice: false, company: '', gstin: '' },
      event: draft.event ?? { time: TIMES[2], hosts: '', food: FOOD[0], notes: '' },
      date: draft.date,
      guests: draft.guests,
      terms: false as unknown as true,
    },
  });

  // Keep the order summary live as date / guests change.
  const date = watch('date');
  const guests = watch('guests');
  const wantsGst = watch('contact.gstInvoice');
  useEffect(() => {
    const g = Number(guests);
    if (date && g >= pkg.guests.min && g <= pkg.guests.max) dispatch(updateSelection({ date, guests: g }));
  }, [date, guests, dispatch, pkg.guests.min, pkg.guests.max]);

  const formProps = { package_slug: pkg.slug, tier: draft.tier, current_step: 'booking_details' };
  const { onFocus, onBlur, fieldsCompleted } = useFormTracking({
    started: 'booking_form_started', fieldFilled: 'booking_form_field_filled', props: formProps, stepOf: formStep,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  useEffect(() => track('booking_form_viewed', { ...formProps, has_saved_contact: !!draft.contact }), []);

  const time = watch('event.time');
  const prevTime = useRef(time);
  useEffect(() => {
    if (time === prevTime.current) return;
    prevTime.current = time;
    track('time_slot_selected', { ...formProps, time_selected: time });
  }, [time]); // eslint-disable-line react-hooks/exhaustive-deps

  const invalid = (fields: string[]) => track('booking_form_validation_failed', { ...formProps, fields, fields_completed: fieldsCompleted() });

  const submitValid = handleSubmit(values => {
    if (values.date < minEventDate()) {
      invalid(['date']);
      return setError('date', { message: 'Earliest date is 7 days from today' });
    }
    if (values.guests < pkg.guests.min || values.guests > pkg.guests.max) {
      invalid(['guests']);
      return setError('guests', { message: `${pkg.guests.min}–${pkg.guests.max} guests` });
    }
    track('booking_form_submitted', {
      ...formProps, event_date: values.date, quantity: values.guests, time_selected: values.event.time, food: values.event.food,
      addons_count: draft.addons.length, gst_invoice: values.contact.gstInvoice, whatsapp_opt_in: values.contact.whatsapp,
    });
    dispatch(setDetails({ contact: values.contact, event: values.event, date: values.date, guests: values.guests }));
    router.push('/checkout/payment');
  }, errs => invalid(errorFields(errs)));

  const onSubmit = (e: React.FormEvent) => {
    track('booking_form_submit_attempted', { ...formProps, fields_completed: fieldsCompleted() });
    return submitValid(e);
  };

  return (
    <form onSubmit={onSubmit} onFocus={onFocus} onBlur={onBlur} noValidate>
      <Step n={1} title="Contact details">
        <div className="grid gap-x-3.5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="c-name" error={errors.contact?.name?.message} required>
            <Input id="c-name" autoComplete="name" aria-invalid={!!errors.contact?.name} {...register('contact.name')} />
          </Field>
          <Field label="Mobile number" htmlFor="c-phone" error={errors.contact?.phone?.message} required>
            <Input id="c-phone" type="tel" autoComplete="tel" placeholder="10-digit mobile" aria-invalid={!!errors.contact?.phone} {...register('contact.phone')} />
          </Field>
          <Field label="Email" htmlFor="c-email" error={errors.contact?.email?.message} required>
            <Input id="c-email" type="email" autoComplete="email" aria-invalid={!!errors.contact?.email} {...register('contact.email')} />
          </Field>
          <Field label="Your city" htmlFor="c-city">
            <Input id="c-city" autoComplete="address-level2" {...register('contact.city')} />
          </Field>
        </div>
        <Checkbox label="Send booking updates on WhatsApp" {...register('contact.whatsapp')} />
      </Step>

      <Step n={2} title="Event details">
        <div className="grid gap-x-3.5 sm:grid-cols-3">
          <Field label="Event date" htmlFor="e-date" error={errors.date?.message} required>
            <Input id="e-date" type="date" min={minEventDate()} aria-invalid={!!errors.date} {...register('date')} />
          </Field>
          <Field label="Guests" htmlFor="e-guests" error={errors.guests?.message} hint={couple ? undefined : `${pkg.guests.min}–${pkg.guests.max} guests`} required>
            <Input id="e-guests" type="number" min={pkg.guests.min} max={pkg.guests.max} readOnly={couple} aria-invalid={!!errors.guests} {...register('guests')} />
          </Field>
          <Field label="Start time" htmlFor="e-time">
            <Select id="e-time" {...register('event.time')}>{TIMES.map(t => <option key={t}>{t}</option>)}</Select>
          </Field>
        </div>
        <div className="grid gap-x-3.5 sm:grid-cols-2">
          <Field label={isWedding ? 'Names of the couple' : 'Host / celebrant'} htmlFor="e-hosts">
            <Input id="e-hosts" placeholder={isWedding ? 'e.g. Ananya & Rohan' : 'e.g. Aarav (turning 6)'} {...register('event.hosts')} />
          </Field>
          <Field label="Food preference" htmlFor="e-food">
            <Select id="e-food" {...register('event.food')}>{FOOD.map(t => <option key={t}>{t}</option>)}</Select>
          </Field>
        </div>
        <Field label="Special requests" htmlFor="e-notes">
          <Textarea id="e-notes" placeholder="Theme, colours, must-have songs, accessibility needs…" {...register('event.notes')} />
        </Field>
      </Step>

      <Step n={3} title="Make it extra special" aside={<span className="font-sans text-sm font-normal text-ink-400">(optional)</span>}>
        <AddonsPicker />
      </Step>

      <Step n={4} title="Billing & confirmation">
        <Checkbox className="mb-4" label="I need a GST invoice (for business bookings)" {...register('contact.gstInvoice')} />
        {wantsGst && (
          <div className="grid gap-x-3.5 sm:grid-cols-2">
            <Field label="Company name" htmlFor="b-company" error={errors.contact?.company?.message} required>
              <Input id="b-company" aria-invalid={!!errors.contact?.company} {...register('contact.company')} />
            </Field>
            <Field label="GSTIN" htmlFor="b-gstin" error={errors.contact?.gstin?.message} required>
              <Input id="b-gstin" placeholder="22AAAAA0000A1Z5" className="uppercase" aria-invalid={!!errors.contact?.gstin} {...register('contact.gstin')} />
            </Field>
          </div>
        )}
        <Checkbox
          label={<>I agree to the <Link href="/about#terms" data-track="terms_and_conditions_viewed" className="text-brand-700 underline">terms</Link> and <Link href={`/packages/${pkg.slug}#policies`} data-track="cancellation_policy_viewed" className="text-brand-700 underline">cancellation policy</Link>.</>}
          {...register('terms')}
        />
        {errors.terms && <p role="alert" className="ml-7 mt-1 text-xs text-danger">{errors.terms.message}</p>}
        <Button type="submit" size="lg" block className="mt-6" loading={isSubmitting}>
          Continue to Payment <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="mt-3 text-center text-sm text-ink-400">
          Not ready to pay?{' '}
          <button type="button" className="font-semibold text-brand-700" onClick={() => dispatch(openEnquiry({ packageSlug: pkg.slug, date: draft.date, guests: draft.guests, source: 'checkout' }))}>
            Send this as an enquiry instead
          </button>
        </p>
      </Step>
    </form>
  );
}
