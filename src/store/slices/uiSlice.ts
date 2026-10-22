import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';
import { hydrate } from '../actions';

export interface EnquiryContext {
  packageSlug?: string;
  category?: string;
  destination?: string;
  date?: string;
  guests?: number;
  source?: string;
}

export interface Toast {
  id: string;
  message: string;
  tone: 'default' | 'success' | 'error';
}

interface UiState {
  hydrated: boolean;
  enquiry: { open: boolean; context: EnquiryContext };
  authOpen: boolean;
  mobileNavOpen: boolean;
  toasts: Toast[];
}

const initialState: UiState = {
  hydrated: false,
  enquiry: { open: false, context: {} },
  authOpen: false,
  mobileNavOpen: false,
  toasts: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openEnquiry(state, { payload }: PayloadAction<EnquiryContext | undefined>) {
      state.enquiry = { open: true, context: payload ?? {} };
      state.mobileNavOpen = false;
    },
    closeEnquiry(state) {
      state.enquiry.open = false;
    },
    openAuth(state) {
      state.authOpen = true;
      state.mobileNavOpen = false;
    },
    closeAuth(state) {
      state.authOpen = false;
    },
    setMobileNav(state, { payload }: PayloadAction<boolean>) {
      state.mobileNavOpen = payload;
    },
    showToast: {
      reducer(state, { payload }: PayloadAction<Toast>) {
        state.toasts = [...state.toasts.slice(-2), payload];
      },
      prepare(message: string, tone: Toast['tone'] = 'default') {
        return { payload: { id: nanoid(), message, tone } };
      },
    },
    dismissToast(state, { payload }: PayloadAction<string>) {
      state.toasts = state.toasts.filter(t => t.id !== payload);
    },
  },
  extraReducers: b => b.addCase(hydrate, state => { state.hydrated = true; }),
});

export const { openEnquiry, closeEnquiry, openAuth, closeAuth, setMobileNav, showToast, dismissToast } = uiSlice.actions;
export default uiSlice.reducer;
