'use client';

import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics/client';
import type { EventName, EventProps } from '@/lib/analytics/events';

/** Fires `name` once per mount when the returned ref's element is at least 40% visible. */
export function useTrackView<T extends Element>(name: EventName, props: EventProps = {}) {
  const ref = useRef<T>(null);
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      obs.disconnect();
      track(name, latest.current);
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [name]);

  return ref;
}
