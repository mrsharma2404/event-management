'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { packageViewed } from '@/store/slices/accountSlice';
import { track } from '@/lib/analytics/client';
import type { EventProps } from '@/lib/analytics/events';

/** Records the package in "recently viewed" once persisted state has loaded, and sends `event_viewed`. */
export function TrackView({ slug, props }: { slug: string; props: EventProps }) {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector(s => s.ui.hydrated);
  useEffect(() => { if (hydrated) dispatch(packageViewed(slug)); }, [dispatch, slug, hydrated]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- props are static per slug
  useEffect(() => track('event_viewed', { package_slug: slug, ...props }), [slug]);
  return null;
}
