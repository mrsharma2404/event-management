import type { Metadata } from 'next';
import { Suspense } from 'react';
import { filtersFromParams, filtersToParams, listingTitle, searchPackages } from '@/lib/catalog';
import { PackagesExplorer } from '@/components/packages/PackagesExplorer';
import { Breadcrumbs, Skeleton } from '@/components/ui/misc';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return { title: listingTitle(filtersFromParams(await searchParams)) };
}

export default async function PackagesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = filtersFromParams(sp);
  const initialItems = searchPackages(filters);
  return (
    <div className="container">
      <div className="pt-7"><Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Packages' }]} /></div>
      <Suspense fallback={<Skeleton className="mb-16 h-[600px]" />}>
        <PackagesExplorer initialItems={initialItems} initialQuery={filtersToParams(filters).toString()} />
      </Suspense>
    </div>
  );
}
