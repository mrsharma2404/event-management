'use client';

import { useAppSelector } from '@/store/hooks';
import { useHydrated } from '@/hooks/useHydrated';
import { getPackage } from '@/lib/catalog';
import { PackageCard } from '@/components/packages/PackageCard';
import { SectionHeading } from '@/components/ui/misc';
import type { EventPackage } from '@/types';

export function RecentlyViewed({ exclude, title = 'Recently viewed' }: { exclude?: string; title?: string }) {
  const hydrated = useHydrated();
  const slugs = useAppSelector(s => s.account.recentlyViewed);
  const items = slugs.filter(s => s !== exclude).map(getPackage).filter((p): p is EventPackage => !!p).slice(0, 4);
  if (!hydrated || !items.length) return null;
  return (
    <section className="py-12">
      <div className="container">
        <SectionHeading eyebrow="Pick up where you left off" title={title} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.map(p => <PackageCard key={p.slug} pkg={p} />)}</div>
      </div>
    </section>
  );
}
