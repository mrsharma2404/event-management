'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { CalendarClock, CreditCard, Landmark, Smartphone } from 'lucide-react';
import type { PaymentMethod } from '@/types';
import { Field, Input, Select } from '@/components/ui/Field';
import { inr } from '@/lib/format';
import { luhn } from '@/lib/validation';
import { cn } from '@/lib/cn';

export interface PaymentMethodsHandle {
  /** Validates the active method's inputs; returns true if payment can proceed. */
  validate: () => boolean;
}

const TABS: { key: PaymentMethod; label: string; icon: typeof Smartphone }[] = [
  { key: 'upi', label: 'UPI', icon: Smartphone },
  { key: 'card', label: 'Credit / Debit card', icon: CreditCard },
  { key: 'netbanking', label: 'Net banking', icon: Landmark },
  { key: 'emi', label: 'EMI', icon: CalendarClock },
];
const UPI_APPS = ['Google Pay', 'PhonePe', 'Paytm', 'BHIM'];
const BANKS = ['HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak', 'Yes Bank'];
const TENURES = [{ m: 3, r: 0 }, { m: 6, r: 0 }, { m: 9, r: 13 }, { m: 12, r: 14 }];

interface Props {
  method: PaymentMethod;
  onMethodChange: (m: PaymentMethod) => void;
  amount: number;
}

export const PaymentMethods = forwardRef<PaymentMethodsHandle, Props>(function PaymentMethods({ method, onMethodChange, amount }, ref) {
  const [upiApp, setUpiApp] = useState(UPI_APPS[0]);
  const [vpa, setVpa] = useState('');
  const [card, setCard] = useState({ number: '', name: '', exp: '', cvv: '' });
  const [bank, setBank] = useState(BANKS[0]);
  const [tenure, setTenure] = useState(TENURES[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useImperativeHandle(ref, () => ({
    validate() {
      const e: Record<string, string> = {};
      if (method === 'upi' && vpa && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(vpa)) e.vpa = 'Enter a valid UPI ID (e.g. name@bank)';
      if (method === 'card') {
        if (!luhn(card.number.replace(/\s/g, ''))) e.number = 'Enter a valid card number';
        if (!card.name.trim()) e.name = 'Enter the cardholder name';
        const [mm, yy] = card.exp.split('/').map(Number);
        if (!(mm >= 1 && mm <= 12 && yy >= 0) || new Date(2000 + yy, mm) <= new Date()) e.exp = 'Enter a valid future expiry';
        if (!/^\d{3,4}$/.test(card.cvv)) e.cvv = '3–4 digits';
      }
      setErrors(e);
      return Object.keys(e).length === 0;
    },
  }));

  const rate = tenure.r / 1200;
  const emi = rate ? (amount * rate * (1 + rate) ** tenure.m) / ((1 + rate) ** tenure.m - 1) : amount / tenure.m;

  return (
    <div className="grid overflow-hidden rounded-[14px] border-[1.5px] border-line md:grid-cols-[220px_1fr]">
      <div role="tablist" className="no-scrollbar flex overflow-x-auto bg-cream md:flex-col">
        {TABS.map(t => (
          <button key={t.key} type="button" role="tab" aria-selected={method === t.key} onClick={() => { onMethodChange(t.key); setErrors({}); }}
            className={cn('flex items-center gap-2.5 whitespace-nowrap border-b-[3px] px-4 py-4 text-left text-sm font-semibold md:border-b-0 md:border-l-[3px]',
              method === t.key ? 'border-brand-600 bg-white text-brand-700' : 'border-transparent text-ink-600 hover:text-brand-700')}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-6" role="tabpanel">
        {method === 'upi' && (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {UPI_APPS.map(a => (
                <button key={a} type="button" onClick={() => { setUpiApp(a); setVpa(''); }}
                  className={cn('rounded-xl border-[1.5px] px-2 py-3 text-xs font-semibold', upiApp === a && !vpa ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line bg-white')}>
                  {a}
                </button>
              ))}
            </div>
            <Field label="Or enter UPI ID" htmlFor="vpa" error={errors.vpa}>
              <Input id="vpa" placeholder="yourname@okhdfcbank" value={vpa} onChange={e => setVpa(e.target.value.trim())} aria-invalid={!!errors.vpa} />
            </Field>
            <p className="text-xs text-ink-400">You’ll get a payment request on {vpa || upiApp}.</p>
          </>
        )}

        {method === 'card' && (
          <>
            <Field label="Card number" htmlFor="cc-number" error={errors.number}>
              <Input id="cc-number" inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" maxLength={19} aria-invalid={!!errors.number}
                value={card.number} onChange={e => setCard(c => ({ ...c, number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})(?=.)/g, '$1 ') }))} />
            </Field>
            <Field label="Name on card" htmlFor="cc-name" error={errors.name}>
              <Input id="cc-name" autoComplete="cc-name" value={card.name} aria-invalid={!!errors.name} onChange={e => setCard(c => ({ ...c, name: e.target.value }))} />
            </Field>
            <div className="grid grid-cols-2 gap-3.5">
              <Field label="Expiry" htmlFor="cc-exp" error={errors.exp}>
                <Input id="cc-exp" autoComplete="cc-exp" placeholder="MM/YY" maxLength={5} value={card.exp} aria-invalid={!!errors.exp}
                  onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 4); setCard(c => ({ ...c, exp: v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v })); }} />
              </Field>
              <Field label="CVV" htmlFor="cc-cvv" error={errors.cvv}>
                <Input id="cc-cvv" type="password" inputMode="numeric" autoComplete="cc-csc" maxLength={4} placeholder="•••" value={card.cvv} aria-invalid={!!errors.cvv}
                  onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '') }))} />
              </Field>
            </div>
          </>
        )}

        {method === 'netbanking' && (
          <>
            <div className="mb-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {BANKS.map(b => (
                <button key={b} type="button" onClick={() => setBank(b)}
                  className={cn('rounded-xl border-[1.5px] p-3 text-sm font-semibold', bank === b ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line bg-white')}>{b}</button>
              ))}
            </div>
            <p className="text-sm text-ink-400">You’ll be redirected to {bank}’s secure page.</p>
          </>
        )}

        {method === 'emi' && (
          <>
            <Field label="Bank" htmlFor="emi-bank"><Select id="emi-bank" value={bank} onChange={e => setBank(e.target.value)}>{BANKS.slice(0, 5).map(b => <option key={b}>{b}</option>)}</Select></Field>
            <Field label="Tenure" htmlFor="emi-tenure">
              <Select id="emi-tenure" value={tenure.m} onChange={e => setTenure(TENURES.find(t => t.m === Number(e.target.value))!)}>
                {TENURES.map(t => <option key={t.m} value={t.m}>{t.m} months · {t.r ? `${t.r}% p.a.` : 'No-cost EMI'}</option>)}
              </Select>
            </Field>
            <div className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-700">
              ≈ <strong>{inr(emi)}/month</strong> for {tenure.m} months{tenure.r ? '' : ' — no extra cost'}
            </div>
          </>
        )}
      </div>
    </div>
  );
});
