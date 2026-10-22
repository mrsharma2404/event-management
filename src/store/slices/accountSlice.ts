import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { hydrate } from '../actions';

export interface AccountState {
  user: { name: string; phone: string } | null;
  /** Ids of bookings / enquiries created from this browser (used to fetch "My bookings"). */
  bookingIds: string[];
  enquiryIds: string[];
  recentlyViewed: string[];
}

const initialState: AccountState = { user: null, bookingIds: [], enquiryIds: [], recentlyViewed: [] };

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    loggedIn(state, { payload }: PayloadAction<{ name: string; phone: string }>) {
      state.user = payload;
    },
    loggedOut(state) {
      state.user = null;
    },
    bookingCreated(state, { payload }: PayloadAction<string>) {
      if (!state.bookingIds.includes(payload)) state.bookingIds.unshift(payload);
    },
    enquiryCreated(state, { payload }: PayloadAction<string>) {
      if (!state.enquiryIds.includes(payload)) state.enquiryIds.unshift(payload);
    },
    packageViewed(state, { payload }: PayloadAction<string>) {
      state.recentlyViewed = [payload, ...state.recentlyViewed.filter(s => s !== payload)].slice(0, 8);
    },
  },
  extraReducers: b => b.addCase(hydrate, (state, { payload }) => (payload.account ? { ...state, ...payload.account } : state)),
});

export const { loggedIn, loggedOut, bookingCreated, enquiryCreated, packageViewed } = accountSlice.actions;
export default accountSlice.reducer;
