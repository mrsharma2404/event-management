import { createListenerMiddleware } from '@reduxjs/toolkit';
import type { BookingDraftState } from './slices/bookingDraftSlice';
import type { AccountState } from './slices/accountSlice';

export interface PersistedState {
  bookingDraft: BookingDraftState;
  wishlist: { slugs: string[] };
  account: AccountState;
}

const KEY = 'crown-co:v1';

export function loadPersisted(): Partial<PersistedState> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<PersistedState>) : {};
  } catch {
    return {};
  }
}

export function persistNow(s: PersistedState) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ bookingDraft: s.bookingDraft, wishlist: s.wishlist, account: s.account }));
  } catch {
    /* storage full or disabled — app still works in-memory */
  }
}

export const persistenceMiddleware = createListenerMiddleware();

persistenceMiddleware.startListening({
  predicate: action => /^(bookingDraft|wishlist|account)\//.test(action.type),
  effect: async (_action, api) => {
    // Coalesce bursts of updates (e.g. typing) into one write.
    api.cancelActiveListeners();
    await api.delay(150);
    persistNow(api.getState() as PersistedState);
  },
});

