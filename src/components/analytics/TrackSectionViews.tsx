'use client';

import { useEffect } from 'react';
import { trackOnce } from '@/lib/analytics/client';
import type { EventName, EventProps } from '@/lib/analytics/events';

/**
 * Observes server-rendered sections by element id and fires an event the first time each is scrolled
 * into view. Lets server components stay server components.
 */
export function TrackSectionViews({ sections, props = {} }: { sections: Record<string, EventName | EventName[]>; props?: EventProps }) {
  // Serialised so inline object props don't re-run the effect on every render.
  const key = JSON.stringify({ sections, props });
  useEffect(() => {
    const { sections: map, props: p } = JSON.parse(key) as { sections: Record<string, EventName | EventName[]>; props: EventProps };
    const obs = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const names = ([] as EventName[]).concat(map[e.target.id]);
        names.forEach(n => trackOnce(`${n}:${location.pathname}`, n, { ...p, section: e.target.id }));
        obs.unobserve(e.target);
      }
    }, { threshold: 0.3 });
    Object.keys(map).forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [key]);
  return null;
}
