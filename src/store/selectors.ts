import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './store';
import { getPackage } from '@/lib/catalog';
import { quote } from '@/lib/pricing';

export const selectDraft = (s: RootState) => s.bookingDraft;
export const selectHydrated = (s: RootState) => s.ui.hydrated;
export const selectWishlist = (s: RootState) => s.wishlist.slugs;
export const selectUser = (s: RootState) => s.account.user;

export const selectDraftPackage = createSelector(selectDraft, d => (d.packageSlug ? getPackage(d.packageSlug) ?? null : null));

export const selectDraftQuote = createSelector([selectDraft, selectDraftPackage], (d, pkg) =>
  pkg ? quote(pkg, { tier: d.tier, guests: d.guests, addons: d.addons, coupon: d.coupon }) : null,
);

export const selectIsWishlisted = (slug: string) => (s: RootState) => s.wishlist.slugs.includes(slug);
