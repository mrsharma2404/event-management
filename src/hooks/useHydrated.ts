'use client';

import { useSyncExternalStore } from 'react';
import { useAppSelector } from '@/store/hooks';

const noop = () => () => {};

/**
 * True only when (a) this component is past its own hydration render and
 * (b) persisted state from localStorage has been loaded into Redux.
 *
 * Page segments can hydrate later than the root layout (Suspense / loading.tsx),
 * by which point the store may already hold persisted data. Gating on (a) keeps
 * the first client render identical to the server HTML.
 */
export function useHydrated() {
  const isClientRender = useSyncExternalStore(noop, () => true, () => false);
  const storeHydrated = useAppSelector(s => s.ui.hydrated);
  return isClientRender && storeHydrated;
}
