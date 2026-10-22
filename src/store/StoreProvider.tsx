'use client';

import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from './store';
import { hydrate } from './actions';
import { loadPersisted, persistNow } from './persistence';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState<AppStore>(makeStore);

  // Rehydrate after mount so server and first client render match.
  useEffect(() => {
    store.dispatch(hydrate(loadPersisted()));
    // Writes are debounced; flush immediately if the tab is closed or reloaded.
    const flush = () => persistNow(store.getState());
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
