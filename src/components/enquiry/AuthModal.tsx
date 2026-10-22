'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeAuth, showToast } from '@/store/slices/uiSlice';
import { loggedIn } from '@/store/slices/accountSlice';
import { useSendOtpMutation, useVerifyOtpMutation } from '@/store/api';

type ApiError = { data?: { message?: string } };

/** Mock phone + OTP login. The API issues a fixed demo code (123456). */
export function AuthModal() {
  const dispatch = useAppDispatch();
  const open = useAppSelector(s => s.ui.authOpen);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [sendOtp, sending] = useSendOtpMutation();
  const [verifyOtp, verifying] = useVerifyOtpMutation();

  const close = () => {
    dispatch(closeAuth());
    setStep('phone'); setCode(''); setError('');
  };

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Please enter your name');
    try {
      const r = await sendOtp({ phone }).unwrap();
      setDemoCode(r.demoCode);
      setStep('otp');
    } catch (err) {
      setError((err as ApiError).data?.message ?? 'Could not send OTP');
    }
  };

  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await verifyOtp({ phone, code, name }).unwrap();
      dispatch(loggedIn(user));
      dispatch(showToast(`Welcome, ${user.name.split(' ')[0]}!`, 'success'));
      close();
    } catch (err) {
      setError((err as ApiError).data?.message ?? 'Verification failed');
    }
  };

  return (
    <Modal open={open} onClose={close} title={step === 'phone' ? 'Log in or sign up' : 'Verify your number'}
      description={step === 'phone' ? 'Track bookings, save favourites and check out faster.' : `Enter the 6-digit code sent to +91 ${phone}`}
      className="max-w-md">
      {step === 'phone' ? (
        <form onSubmit={onSend} noValidate>
          <Field label="Your name" htmlFor="auth-name"><Input id="auth-name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></Field>
          <Field label="Mobile number" htmlFor="auth-phone">
            <div className="flex gap-2">
              <span className="grid place-items-center rounded-[10px] border-[1.5px] border-line bg-cream-100 px-3 text-sm font-semibold">+91</span>
              <Input id="auth-phone" type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} autoComplete="tel-national" />
            </div>
          </Field>
          {error && <p className="mb-3 text-sm text-danger">{error}</p>}
          <Button type="submit" block loading={sending.isLoading}>Send OTP</Button>
        </form>
      ) : (
        <form onSubmit={onVerify} noValidate>
          <Field label="One-time password" htmlFor="auth-otp" hint={demoCode ? `Demo mode — use ${demoCode}` : undefined}>
            <Input id="auth-otp" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-xl tracking-[0.5em]" autoComplete="one-time-code" />
          </Field>
          {error && <p className="mb-3 text-sm text-danger">{error}</p>}
          <Button type="submit" block loading={verifying.isLoading}>Verify & continue</Button>
          <button type="button" onClick={() => setStep('phone')} className="mt-3 w-full text-center text-sm font-semibold text-brand-700">Change number</button>
        </form>
      )}
    </Modal>
  );
}
