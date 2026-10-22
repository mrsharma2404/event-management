import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ContactDetails, EventDetails, PaymentMethod, PaymentMode, TierKey } from '@/types';
import { hydrate } from '../actions';

export interface BookingDraftState {
  packageSlug: string | null;
  tier: TierKey;
  date: string;
  guests: number;
  addons: string[];
  coupon: string | null;
  contact: ContactDetails | null;
  event: EventDetails | null;
  paymentMode: PaymentMode;
  paymentMethod: PaymentMethod;
}

export const initialDraft: BookingDraftState = {
  packageSlug: null,
  tier: 'classic',
  date: '',
  guests: 0,
  addons: [],
  coupon: null,
  contact: null,
  event: null,
  paymentMode: 'advance',
  paymentMethod: 'upi',
};

const bookingDraftSlice = createSlice({
  name: 'bookingDraft',
  initialState: initialDraft,
  reducers: {
    /** Starts (or restarts) a draft from the product page booking widget. */
    startDraft(state, { payload }: PayloadAction<{ packageSlug: string; tier: TierKey; date: string; guests: number }>) {
      const samePackage = state.packageSlug === payload.packageSlug;
      return {
        ...initialDraft,
        ...(samePackage ? { addons: state.addons, coupon: state.coupon, contact: state.contact, event: state.event } : { contact: state.contact }),
        ...payload,
      };
    },
    updateSelection(state, { payload }: PayloadAction<Partial<Pick<BookingDraftState, 'tier' | 'date' | 'guests' | 'addons'>>>) {
      Object.assign(state, payload);
    },
    toggleAddon(state, { payload }: PayloadAction<string>) {
      state.addons = state.addons.includes(payload) ? state.addons.filter(a => a !== payload) : [...state.addons, payload];
    },
    setCoupon(state, { payload }: PayloadAction<string | null>) {
      state.coupon = payload;
    },
    setDetails(state, { payload }: PayloadAction<{ contact: ContactDetails; event: EventDetails; date: string; guests: number }>) {
      Object.assign(state, payload);
    },
    setPaymentMode(state, { payload }: PayloadAction<PaymentMode>) {
      state.paymentMode = payload;
    },
    setPaymentMethod(state, { payload }: PayloadAction<PaymentMethod>) {
      state.paymentMethod = payload;
    },
    /** Keeps contact details so repeat bookings are pre-filled. */
    clearDraft(state) {
      return { ...initialDraft, contact: state.contact };
    },
  },
  extraReducers: b => b.addCase(hydrate, (state, { payload }) => (payload.bookingDraft ? { ...state, ...payload.bookingDraft } : state)),
});

export const { startDraft, updateSelection, toggleAddon, setCoupon, setDetails, setPaymentMode, setPaymentMethod, clearDraft } =
  bookingDraftSlice.actions;
export default bookingDraftSlice.reducer;
