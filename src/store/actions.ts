import { createAction } from '@reduxjs/toolkit';
import type { PersistedState } from './persistence';

/** Dispatched once on the client with whatever was saved in localStorage. */
export const hydrate = createAction<Partial<PersistedState>>('app/hydrate');
