import type { Metadata } from 'next';
import { destinations, packages } from '@/lib/catalog';
import { inrShort } from '@/lib/format';
import { DestinationTile } from '@/components/home/sections';
import { SectionHeading, Breadcrumbs } from '@/components/ui/misc';

export const metadata: Metadata = { title: 'Destinations', description: 'Wedding and event destinations across India and abroad — Jaipur, Goa, Kerala, Phuket and more.' };

export default function DestinationsIndexPage() {
  const groups = [
    { title: 'India', items: destinations.filter(d => !d.international) },
    { title: 'International', items: destinations.filter(d => d.international) },
  ];
  return (
    <div className="container py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Destinations' }]} />
      <SectionHeading className="mt-4" eyebrow="Destinations" title="Where will you celebrate?"
        description="Handpicked venues and local crews in every city we serve." />
      {groups.map(g => (
        <div key={g.title} className="mb-12">
          <h2 className="mb-4 font-serif text-2xl font-bold">{g.title}</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {g.items.map(d => {
              const list = packages.filter(p => p.destination === d.slug);
              return <DestinationTile key={d.slug} href={`/destinations/${d.slug}`} photo={d.image} title={d.name}
                subtitle={`${d.region} · from ${inrShort(Math.min(...list.map(p => p.price)))}`} pill={`${list.length} packages`} />;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
