'use client';

import { Heart } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHydrated } from '@/hooks/useHydrated';
import { clearWishlist } from '@/store/slices/wishlistSlice';
import { getPackage } from '@/lib/catalog';
import { PackageCard } from '@/components/packages/PackageCard';
import { EmptyState, Skeleton } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { EnquireButton } from '@/components/enquiry/EnquireButton';
import type { EventPackage } from '@/types';

export function WishlistView() {
  const dispatch = useAppDispatch();
  const hydrated = useHydrated();
  const items = useAppSelector(s => s.wishlist.slugs).map(getPackage).filter((p): p is EventPackage => !!p);

  if (!hydrated) return <Skeleton className="mb-16 h-80" />;
  if (!items.length) {
    return (
      <div className="pb-16">
        <EmptyState icon={<Heart className="h-7 w-7" />} title="Your wishlist is empty" description="Tap the heart on any package to save it here and compare later."
          action={<ButtonLink href="/packages">Discover packages</ButtonLink>} />
      </div>
    );
  }
  return (
    <div className="pb-16">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-600">{items.length} saved package{items.length > 1 ? 's' : ''}</p>
        <div className="flex gap-3">
          <EnquireButton variant="outline" size="sm" context={{ source: 'wishlist', category: items[0].category }}>Ask a planner to compare</EnquireButton>
          <button onClick={() => dispatch(clearWishlist())} className="text-sm font-semibold text-brand-700">Clear all</button>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.map(p => <PackageCard key={p.slug} pkg={p} />)}</div>
    </div>
  );
}
