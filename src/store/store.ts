import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import bookingDraft from './slices/bookingDraftSlice';
import wishlist from './slices/wishlistSlice';
import account from './slices/accountSlice';
import ui from './slices/uiSlice';
import { api } from './api';
import { persistenceMiddleware } from './persistence';
import { analyticsListener } from './analyticsListener';

const rootReducer = combineReducers({ bookingDraft, wishlist, account, ui, [api.reducerPath]: api.reducer });

/** A fresh store per request/client — the recommended pattern for the Next.js App Router. */
export function makeStore() {
  const store = configureStore({
    reducer: rootReducer,
    middleware: gDM => gDM().prepend(persistenceMiddleware.middleware, analyticsListener.middleware).concat(api.middleware),
  });
  setupListeners(store.dispatch);
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore['dispatch'];
