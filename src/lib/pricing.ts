import type { EventPackage, Quote, TierKey } from '@/types';
import { addons as ALL_ADDONS, coupons } from './data/addons';
import { isoDate } from './format';

export const GST_RATE = 0.18;
export const ADVANCE_RATE = 0.2;
export const FULL_PAY_DISCOUNT = 0.03;

export const findCoupon = (code?: string | null) =>
  code ? coupons.find(c => c.code === code.trim().toUpperCase()) ?? null : null;

/**
 * Single source of truth for pricing. Used by the booking widget, checkout
 * summary AND the /api/bookings route, so the server re-computes what the client shows.
 */
export function quote(
  pkg: EventPackage,
  opts: { tier: TierKey; guests: number; addons?: string[]; coupon?: string | null },
): Quote {
  const tier = pkg.tiers.find(t => t.key === opts.tier) ?? pkg.tiers[0];
  const guests = clampGuests(pkg, opts.guests);
  const extraGuests = Math.max(0, guests - pkg.guests.included);
  const extraGuestsCost = Math.round(extraGuests * pkg.perGuest * tier.multiplier);
  const chosen = ALL_ADDONS.filter(a => opts.addons?.includes(a.key));
  const addonsTotal = chosen.reduce((s, a) => s + a.price, 0);
  const gross = tier.price + extraGuestsCost + addonsTotal;
  const c = findCoupon(opts.coupon);
  const discount = c ? Math.round(Math.min(gross * c.percent, c.maxDiscount)) : 0;
  const subtotal = gross - discount;
  const gst = Math.round(subtotal * GST_RATE);
  const total = subtotal + gst;
  return {
    tier, guests, extraGuests, extraGuestsCost, addons: chosen, addonsTotal, discount, subtotal, gst, total,
    advance: Math.round(total * ADVANCE_RATE),
    fullPayment: Math.round(total * (1 - FULL_PAY_DISCOUNT)),
  };
}

export function clampGuests(pkg: EventPackage, n: number) {
  if (!Number.isFinite(n)) return pkg.guests.included;
  return Math.max(pkg.guests.min, Math.min(pkg.guests.max, Math.round(n)));
}

/** Balance due 15 days before the event (or today if that's already past). */
export function balanceDueDate(eventDate: string) {
  const d = new Date(eventDate + 'T00:00:00');
  d.setDate(d.getDate() - 15);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return isoDate(d < today ? today : d);
}
