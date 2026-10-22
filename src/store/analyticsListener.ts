import { createListenerMiddleware, isRejectedWithValue } from '@reduxjs/toolkit';
import { identify, track } from '@/lib/analytics/client';
import { getPackage } from '@/lib/catalog';
import { addons } from '@/lib/data/addons';
import { loggedIn, loggedOut } from './slices/accountSlice';
import { toggleWishlist } from './slices/wishlistSlice';
import { setCoupon, setPaymentMethod, setPaymentMode, startDraft, toggleAddon, updateSelection } from './slices/bookingDraftSlice';
import type { RootState } from './store';

/** Turns state changes that already flow through Redux into analytics events, so components stay clean. */
export const analyticsListener = createListenerMiddleware();
const listen = analyticsListener.startListening.withTypes<RootState>();

const pkgProps = (slug: string | null) => {
  const p = slug ? getPackage(slug) : undefined;
  return p ? { package_slug: p.slug, category: p.category, destination: p.destination, price: p.price, currency: 'INR' } : {};
};

listen({
  actionCreator: toggleWishlist,
  effect: ({ payload }, api) => {
    const added = api.getState().wishlist.slugs.includes(payload);
    track(added ? 'wishlist_added' : 'wishlist_removed', { ...pkgProps(payload), wishlist_size: api.getState().wishlist.slugs.length });
  },
});

listen({
  actionCreator: startDraft,
  effect: ({ payload }) => {
    track('add_to_cart', { ...pkgProps(payload.packageSlug), tier: payload.tier, event_date: payload.date, quantity: payload.guests });
  },
});

listen({
  actionCreator: updateSelection,
  effect: (_action, api) => {
    const before = api.getOriginalState().bookingDraft;
    const after = api.getState().bookingDraft;
    const changed = (['tier', 'date', 'guests'] as const).filter(k => before[k] !== after[k]);
    if (changed.length) {
      track('cart_updated', { ...pkgProps(after.packageSlug), changed_fields: [...changed], tier: after.tier, event_date: after.date, quantity: after.guests });
    }
  },
});

listen({
  actionCreator: toggleAddon,
  effect: ({ payload }, api) => {
    const on = api.getState().bookingDraft.addons.includes(payload);
    const addon = addons.find(a => a.key === payload);
    track(on ? 'add_on_selected' : 'add_on_removed', { ...pkgProps(api.getState().bookingDraft.packageSlug), add_on: payload, add_on_price: addon?.price });
  },
});

listen({
  actionCreator: setCoupon,
  effect: ({ payload }, api) => {
    if (payload) track('coupon_applied', { ...pkgProps(api.getState().bookingDraft.packageSlug), coupon: payload });
  },
});

listen({
  predicate: action => setPaymentMode.match(action) || setPaymentMethod.match(action),
  effect: (_action, api) => {
    const { paymentMode, paymentMethod, packageSlug } = api.getState().bookingDraft;
    track('payment_method_selected', { ...pkgProps(packageSlug), payment_mode: paymentMode, payment_method: paymentMethod });
  },
});

listen({
  actionCreator: loggedIn,
  effect: async ({ payload }) => {
    identify({ userId: await hashId(payload.phone), isLoggedIn: true });
    track('login_success', { method: 'phone_otp' });
  },
});

listen({
  actionCreator: loggedOut,
  effect: () => {
    track('logout');
    identify({ userId: null, isLoggedIn: false });
  },
});

/** Any failed /api call (validation errors, 5xx, network). */
listen({
  predicate: isRejectedWithValue,
  effect: action => {
    const meta = action.meta as { arg?: { endpointName?: string } };
    const payload = action.payload as { status?: number | string; data?: { message?: string } } | undefined;
    track('api_error', {
      endpoint: meta.arg?.endpointName ?? 'unknown',
      error_code: String(payload?.status ?? 'unknown'),
      error_message: payload?.data?.message?.slice(0, 200),
    });
  },
});

/** Stable pseudonymous user id — the phone number itself never leaves the browser in analytics. */
export async function hashId(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`crown-co:${value}`));
  return Array.from(new Uint8Array(digest).slice(0, 16), b => b.toString(16).padStart(2, '0')).join('');
}
