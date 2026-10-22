import type { Metadata } from 'next';
import { categories, packages } from '@/lib/catalog';
import { inrShort } from '@/lib/format';
import { DestinationTile } from '@/components/home/sections';
import { SectionHeading, Breadcrumbs } from '@/components/ui/misc';

export const metadata: Metadata = { title: 'All Occasions', description: 'Weddings, birthdays, corporate events, concerts and more — explore every occasion we plan.' };

export default function EventsIndexPage() {
  return (
    <div className="container py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Occasions' }]} />
      <SectionHeading className="mt-4" eyebrow="Every occasion" title="What are you celebrating?"
        description="Pick an occasion to see curated packages, real prices and reviews." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {categories.map(c => {
          const list = packages.filter(p => p.category === c.slug);
          return <DestinationTile key={c.slug} href={`/events/${c.slug}`} photo={c.image} title={c.name}
            subtitle={`${c.tagline} · from ${inrShort(Math.min(...list.map(p => p.price)))}`} pill={`${list.length} packages`} />;
        })}
      </div>
    </div>
  );
}
