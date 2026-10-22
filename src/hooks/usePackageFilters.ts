'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { DEFAULT_FILTERS, filtersFromParams, filtersToParams } from '@/lib/catalog';
import type { PackageFilters } from '@/types';

/** The URL is the source of truth for listing filters — shareable, back-button friendly, SSR-able. */
export function usePackageFilters() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(searchParams.toString())), [searchParams]);
  const queryString = useMemo(() => filtersToParams(filters).toString(), [filters]);

  const setFilters = useCallback(
    (patch: Partial<PackageFilters> | ((f: PackageFilters) => Partial<PackageFilters>)) => {
      const next = { ...filters, ...(typeof patch === 'function' ? patch(filters) : patch) };
      const qs = filtersToParams(next).toString();
      // Native history API is integrated with the App Router (no server round-trip);
      // results are fetched client-side through RTK Query.
      window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname);
    },
    [filters, pathname],
  );

  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), [setFilters]);

  return { filters, queryString, setFilters, reset };
}
