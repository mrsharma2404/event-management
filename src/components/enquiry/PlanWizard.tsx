'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MapPin } from 'lucide-react';
import { categories, destinations, packages } from '@/lib/catalog';
import { minEventDate } from '@/lib/format';
import { enquirySchema } from '@/lib/validation';
import { useCreateEnquiryMutation } from '@/store/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { enquiryCreated } from '@/store/slices/accountSlice';
import { showToast } from '@/store/slices/uiSlice';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { SmartImage } from '@/components/ui/SmartImage';
import { PackageCard } from '@/components/packages/PackageCard';
import { BUDGET_OPTIONS } from './EnquiryForm';
import { cn } from '@/lib/cn';
import type { EnquiryRecord } from '@/types';
import { track } from '@/lib/analytics/client';
import { useTrackView } from '@/hooks/useTrackView';
import { useFormTracking } from '@/hooks/useFormTracking';

const VIBES = ['Royal & traditional', 'Modern & minimal', 'Boho & outdoorsy', 'Glam & over-the-top', 'Intimate & cosy', 'Not sure yet'];
const STEPS = ['Occasion', 'Destination', 'Date & guests', 'Budget & style', 'Your details'];

interface WizardState {
  category: string; destination: string; date: string; flexible: boolean; guests: string;
  budget: string; vibes: string[]; name: string; phone: string; email: string; message: string;
}

const FORM_PROPS = { form_source: 'plan-my-event', form_type: 'wizard' };

const tile = (on: boolean) =>
  cn('relative rounded-[14px] border-2 bg-white p-4 text-left transition hover:border-gold', on ? 'border-brand-600 bg-brand-50' : 'border-line');

export function PlanWizard() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.account.user);
  const [step, setStep] = useState(0);
  const [s, setS] = useState<WizardState>({
    category: '', destination: '', date: '', flexible: false, guests: '', budget: '', vibes: [],
    name: '', phone: '', email: '', message: '',
  });
  useEffect(() => {
    if (user) setS(prev => ({ ...prev, name: prev.name || user.name, phone: prev.phone || user.phone }));
  }, [user]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<EnquiryRecord | null>(null);
  const [createEnquiry, { isLoading }] = useCreateEnquiryMutation();
  const set = (patch: Partial<WizardState>) => setS(prev => ({ ...prev, ...patch }));

  const viewRef = useTrackView<HTMLDivElement>('enquiry_form_viewed', FORM_PROPS);
  const { onFocus, onBlur, fieldsCompleted } = useFormTracking({ fieldFilled: 'enquiry_field_filled', props: { ...FORM_PROPS, step: 5 } });

  // Each answered step is a "field filled"; the answers are non-personal and useful for lead scoring.
  const prevStep = useRef(0);
  useEffect(() => {
    const from = prevStep.current;
    prevStep.current = step;
    if (step <= from) return;
    if (from === 0) track('enquiry_form_started', { ...FORM_PROPS, category: s.category });
    const answers = [
      { category: s.category },
      { destination: s.destination || 'undecided' },
      { event_date: s.flexible ? 'flexible' : s.date, guests: Number(s.guests) },
      { budget: s.budget, vibes: s.vibes },
    ][from];
    track('enquiry_field_filled', { ...FORM_PROPS, field_name: STEPS[from], step: from + 1, ...answers });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire on step changes only
  }, [step]);

  const canNext = [!!s.category, true, !!(s.date || s.flexible) && Number(s.guests) > 0, !!s.budget, true][step];

  const submit = async () => {
    const payload = {
      name: s.name, phone: s.phone, email: s.email, category: s.category, destination: s.destination,
      date: s.flexible ? '' : s.date, guests: s.guests, budget: s.budget,
      message: [s.vibes.length && `Style: ${s.vibes.join(', ')}`, s.flexible && 'Dates flexible', s.message].filter(Boolean).join('\n'),
      source: 'plan-my-event',
    };
    track('enquiry_submit_attempted', { ...FORM_PROPS, fields_completed: fieldsCompleted() });
    const parsed = enquirySchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map(i => [i.path[0], i.message])));
      track('form_error', { ...FORM_PROPS, form: 'plan_wizard', fields: parsed.error.issues.map(i => String(i.path[0])) });
      return;
    }
    setErrors({});
    const leadProps = { ...FORM_PROPS, category: s.category, destination: s.destination || undefined, budget: s.budget, guests: Number(s.guests) };
    track('enquiry_submitted', leadProps);
    try {
      const rec = await createEnquiry(payload).unwrap();
      track('enquiry_success', { ...leadProps, enquiry_id: rec.id });
      dispatch(enquiryCreated(rec.id));
      setDone(rec);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      track('enquiry_failed', { ...leadProps, error_code: String((err as { status?: unknown }).status ?? 'unknown') });
      dispatch(showToast('Could not submit. Please try again.', 'error'));
    }
  };

  if (done) {
    // Best matches first (occasion + destination), then same occasion, then same destination.
    const score = (p: (typeof packages)[number]) => (p.category === s.category ? 2 : 0) + (p.destination === s.destination ? 1 : 0);
    const picks = packages.filter(p => score(p) > 0).sort((a, b) => score(b) - score(a) || b.reviewCount - a.reviewCount).slice(0, 3);
    return (
      <div className="pb-16">
        <div className="mx-auto max-w-2xl rounded-xl2 bg-white p-8 text-center shadow-card">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-success text-white"><Check className="h-8 w-8" /></div>
          <h2 className="mb-2 font-serif text-3xl font-bold">You’re all set, {done.name.split(' ')[0]}!</h2>
          <p className="text-ink-600">Reference <strong>{done.id}</strong>. Your planner will call you on <strong>{done.phone}</strong> within 2 hours with 3 curated options.</p>
        </div>
        {picks.length > 0 && (
          <div className="mt-12">
            <h3 className="mb-5 font-serif text-2xl font-bold">While you wait — packages that match your brief</h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{picks.map(p => <PackageCard key={p.slug} pkg={p} />)}</div>
          </div>
        )}
        <div className="mt-8 text-center"><ButtonLink href="/packages" variant="outline">Browse all packages</ButtonLink></div>
      </div>
    );
  }

  return (
    <div ref={viewRef} className="mx-auto max-w-4xl pb-16">
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-sm font-semibold"><span>Step {step + 1} of {STEPS.length}: {STEPS[step]}</span><span className="text-ink-400">{Math.round((step / STEPS.length) * 100)}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-cream-200"><div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      </div>

      <div className="rounded-xl2 bg-white p-6 shadow-card sm:p-8">
        {step === 0 && (
          <>
            <h2 className="mb-1 font-serif text-2xl font-bold">What are you celebrating?</h2>
            <p className="mb-6 text-ink-400">Pick one — you can always tell us more later.</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {categories.map(c => (
                <button key={c.slug} type="button" className={tile(s.category === c.slug)} onClick={() => { set({ category: c.slug }); setStep(1); }}>
                  <CategoryIcon name={c.icon} className="mb-2 h-7 w-7 text-brand-700" />
                  <strong className="block text-sm">{c.name}</strong>
                </button>
              ))}
              <button type="button" className={tile(s.category === 'other')} onClick={() => { set({ category: 'other' }); setStep(1); }}>
                <span className="mb-2 block text-2xl">✨</span><strong className="block text-sm">Something else</strong>
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="mb-1 font-serif text-2xl font-bold">Where would you like to celebrate?</h2>
            <p className="mb-6 text-ink-400">Not decided? Skip — we’ll suggest the best fits.</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {destinations.map(d => (
                <button key={d.slug} type="button" onClick={() => { set({ destination: d.slug }); setStep(2); }}
                  className={cn('group relative aspect-[4/3] overflow-hidden rounded-[14px] border-[3px] text-left text-white', s.destination === d.slug ? 'border-brand-600' : 'border-transparent')}>
                  <SmartImage photo={d.image} width={400} fill sizes="25vw" alt="" className="transition group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-b from-transparent to-ink/80" />
                  <span className="absolute bottom-2.5 left-3 font-semibold">{d.name}</span>
                  {s.destination === d.slug && <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-brand text-ink"><Check className="h-3.5 w-3.5" /></span>}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { set({ destination: '' }); setStep(2); }} className="mt-5 flex items-center gap-2 text-sm font-semibold text-brand-700">
              <MapPin className="h-4 w-4" /> I haven’t decided yet
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="mb-6 font-serif text-2xl font-bold">When, and for how many?</h2>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field label="Event date" htmlFor="w-date">
                <Input id="w-date" type="date" min={minEventDate()} value={s.date} disabled={s.flexible} onChange={e => set({ date: e.target.value })} />
              </Field>
              <Field label="Approx. guests" htmlFor="w-guests">
                <Input id="w-guests" type="number" min={1} placeholder="e.g. 150" value={s.guests} onChange={e => set({ guests: e.target.value })} />
              </Field>
            </div>
            <label className="flex items-center gap-2.5 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-700" checked={s.flexible} onChange={e => set({ flexible: e.target.checked, date: '' })} />My dates are flexible</label>
            <div className="mt-5 flex flex-wrap gap-2">
              {[2, 50, 150, 300, 500].map(n => (
                <button key={n} type="button" onClick={() => set({ guests: String(n) })} className={cn('rounded-full border-[1.5px] px-4 py-1.5 text-sm', s.guests === String(n) ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line')}>
                  {n === 2 ? 'Just us' : `${n}${n === 500 ? '+' : ''}`}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="mb-1 font-serif text-2xl font-bold">What’s your budget?</h2>
            <p className="mb-5 text-ink-400">An estimate is fine — it helps us suggest the right venues.</p>
            <div className="mb-7 grid gap-2.5 sm:grid-cols-3">
              {BUDGET_OPTIONS.map(b => <button key={b} type="button" className={tile(s.budget === b)} onClick={() => set({ budget: b })}><strong className="text-sm">{b}</strong></button>)}
            </div>
            <h3 className="mb-3 font-sans font-bold">Pick a vibe <span className="font-normal text-ink-400">(choose any)</span></h3>
            <div className="flex flex-wrap gap-2">
              {VIBES.map(v => {
                const on = s.vibes.includes(v);
                return <button key={v} type="button" onClick={() => set({ vibes: on ? s.vibes.filter(x => x !== v) : [...s.vibes, v] })}
                  className={cn('rounded-full border-[1.5px] px-4 py-2 text-sm font-medium', on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line')}>{v}</button>;
              })}
            </div>
          </>
        )}

        {step === 4 && (
          <div onFocus={onFocus} onBlur={onBlur}>
            <h2 className="mb-1 font-serif text-2xl font-bold">Where should we send your options?</h2>
            <p className="mb-6 text-ink-400">A planner will call or WhatsApp you within 2 hours.</p>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="w-name" error={errors.name} required><Input id="w-name" value={s.name} onChange={e => set({ name: e.target.value })} autoComplete="name" /></Field>
              <Field label="Mobile number" htmlFor="w-phone" error={errors.phone} required><Input id="w-phone" type="tel" value={s.phone} onChange={e => set({ phone: e.target.value })} autoComplete="tel" /></Field>
            </div>
            <Field label="Email" htmlFor="w-email" error={errors.email}><Input id="w-email" type="email" value={s.email} onChange={e => set({ email: e.target.value })} autoComplete="email" /></Field>
            <Field label="Anything else we should know?" htmlFor="w-msg"><Textarea id="w-msg" value={s.message} onChange={e => set({ message: e.target.value })} /></Field>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
          <Button variant="ghost" onClick={() => setStep(x => x - 1)} disabled={step === 0}><ArrowLeft className="h-4 w-4" /> Back</Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(x => x + 1)} disabled={!canNext}>Next <ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button onClick={submit} loading={isLoading}>Get my free plan</Button>
          )}
        </div>
      </div>
    </div>
  );
}
