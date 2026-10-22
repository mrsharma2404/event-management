'use client';

import { useState } from 'react';
import { Tag } from 'lucide-react';
import { useValidateCouponMutation } from '@/store/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCoupon } from '@/store/slices/bookingDraftSlice';
import { showToast } from '@/store/slices/uiSlice';
import { coupons } from '@/lib/data/addons';
import { track } from '@/lib/analytics/client';

export function CouponInput() {
  const dispatch = useAppDispatch();
  const applied = useAppSelector(s => s.bookingDraft.coupon);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [validate, { isLoading }] = useValidateCouponMutation();

  const apply = async () => {
    setError('');
    if (!code.trim()) return;
    try {
      const c = await validate({ code }).unwrap();
      dispatch(setCoupon(c.code));
      dispatch(showToast(`🎉 ${c.code} applied — ${c.label}`, 'success'));
      setCode('');
    } catch {
      track('coupon_failed', { coupon: code.trim().slice(0, 30) });
      setError('That coupon code isn’t valid');
    }
  };

  if (applied) {
    return (
      <div className="mt-3 flex items-center justify-between rounded-xl border-[1.5px] border-dashed border-success bg-success/5 px-3 py-2.5 text-sm">
        <span className="flex items-center gap-2 font-semibold text-success"><Tag className="h-4 w-4" />{applied} applied</span>
        <button onClick={() => dispatch(setCoupon(null))} className="font-semibold text-brand-700">Remove</button>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), apply())}
          placeholder="Coupon code" aria-label="Coupon code"
          className="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-dashed border-gold bg-cream px-3 py-2 uppercase focus:outline-none" />
        <button onClick={apply} disabled={isLoading} className="px-2 font-bold text-brand-700 disabled:opacity-50">{isLoading ? '…' : 'Apply'}</button>
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      <p className="mt-1.5 text-xs text-ink-400">Try {coupons.map(c => <strong key={c.code} className="mr-1">{c.code}</strong>)}</p>
    </div>
  );
}
