'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { categories, destinations } from '@/lib/catalog';
import { enquirySchema } from '@/lib/validation';
import { useCreateEnquiryMutation } from '@/store/api';
import { useAppDispatch } from '@/store/hooks';
import { enquiryCreated } from '@/store/slices/accountSlice';
import { showToast, type EnquiryContext } from '@/store/slices/uiSlice';
import { cn } from '@/lib/cn';
import type { EnquiryRecord } from '@/types';
import { track } from '@/lib/analytics/client';
import { useTrackView } from '@/hooks/useTrackView';
import { errorFields, useFormTracking } from '@/hooks/useFormTracking';

export const BUDGET_OPTIONS = ['Under ₹1 Lakh', '₹1 – 5 Lakh', '₹5 – 15 Lakh', '₹15 – 50 Lakh', '₹50 Lakh+'];

type FormValues = z.input<typeof enquirySchema>;

interface Props {
  context?: EnquiryContext;
  compact?: boolean;
  showMessage?: boolean;
  submitLabel?: string;
  onSuccess?: (record: EnquiryRecord) => void;
  idPrefix?: string;
}

export function EnquiryForm({ context = {}, compact, showMessage, submitLabel = 'Get Free Quote', onSuccess, idPrefix = 'enq' }: Props) {
  const dispatch = useAppDispatch();
  const [createEnquiry, { isLoading }] = useCreateEnquiryMutation();
  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      name: '', phone: '', email: '',
      category: context.category ?? '', destination: context.destination ?? '',
      date: context.date ?? '', guests: context.guests ?? ('' as unknown as number), budget: '', message: '',
      packageSlug: context.packageSlug, source: context.source ?? 'website',
    },
  });

  const formProps = { form_source: context.source ?? 'website', package_slug: context.packageSlug, category: context.category, destination: context.destination };
  const viewRef = useTrackView<HTMLFormElement>('enquiry_form_viewed', formProps);
  const { onFocus, onBlur, fieldsCompleted } = useFormTracking({ started: 'enquiry_form_started', fieldFilled: 'enquiry_field_filled', props: formProps });

  const submitValid = handleSubmit(async values => {
    track('enquiry_submitted', { ...formProps, fields_completed: fieldsCompleted(), has_date: !!values.date, budget: values.budget || undefined });
    try {
      const record = await createEnquiry(values).unwrap();
      track('enquiry_success', { ...formProps, enquiry_id: record.id });
      dispatch(enquiryCreated(record.id));
      if (onSuccess) onSuccess(record);
      else {
        dispatch(showToast(`Thanks ${record.name.split(' ')[0]}! Enquiry ${record.id} received — we’ll call you within 2 hours.`, 'success'));
        reset();
      }
    } catch (err) {
      track('enquiry_failed', { ...formProps, error_code: String((err as { status?: unknown }).status ?? 'unknown') });
      dispatch(showToast('Could not send your enquiry. Please try again.', 'error'));
    }
  }, errs => track('form_error', { ...formProps, form: 'enquiry', fields: errorFields(errs) }));

  const onSubmit = (e: React.FormEvent) => {
    track('enquiry_submit_attempted', { ...formProps, fields_completed: fieldsCompleted() });
    return submitValid(e);
  };

  const id = (n: string) => `${idPrefix}-${n}`;
  const twoCol = cn('grid gap-x-3.5', !compact && 'sm:grid-cols-2');

  return (
    <form ref={viewRef} onSubmit={onSubmit} onFocus={onFocus} onBlur={onBlur} noValidate>
      <div className={twoCol}>
        <Field label="Full name" htmlFor={id('name')} error={errors.name?.message} required>
          <Input id={id('name')} autoComplete="name" placeholder="Your name" aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        <Field label="Mobile number" htmlFor={id('phone')} error={errors.phone?.message} required>
          <Input id={id('phone')} type="tel" autoComplete="tel" placeholder="10-digit mobile" aria-invalid={!!errors.phone} {...register('phone')} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-x-3.5">
        <Field label="Event type" htmlFor={id('category')}>
          <Select id={id('category')} {...register('category')}>
            <option value="">Not sure yet</option>
            {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="City" htmlFor={id('destination')}>
          <Select id={id('destination')} {...register('destination')}>
            <option value="">Not decided</option>
            {destinations.map(d => <option key={d.slug} value={d.slug}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label="Event date" htmlFor={id('date')}>
          <Input id={id('date')} type="date" {...register('date')} />
        </Field>
        <Field label="Guests" htmlFor={id('guests')} error={errors.guests?.message}>
          <Input id={id('guests')} type="number" min={1} placeholder="e.g. 150" {...register('guests')} />
        </Field>
      </div>
      <Field label="Budget" htmlFor={id('budget')}>
        <Select id={id('budget')} {...register('budget')}>
          <option value="">Select budget</option>
          {BUDGET_OPTIONS.map(b => <option key={b}>{b}</option>)}
        </Select>
      </Field>
      {showMessage && (
        <Field label="Tell us more" htmlFor={id('message')}>
          <Textarea id={id('message')} placeholder="Theme, must-haves, questions…" {...register('message')} />
        </Field>
      )}
      <Button type="submit" block loading={isLoading}>{submitLabel}</Button>
      <p className="mt-2.5 text-center text-xs text-ink-400">No spam. A planner will WhatsApp you within 2 hours.</p>
    </form>
  );
}
