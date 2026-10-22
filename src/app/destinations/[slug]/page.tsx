import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalendarDays, Building, MapPin } from 'lucide-react';
import { categories, collectionStats, destinations, getDestination, packages } from '@/lib/catalog';
import { inrShort } from '@/lib/format';
import { PageHero, StatRow } from '@/components/collection/PageHero';
import { FilterablePackages } from '@/components/collection/FilterablePackages';
import { SidebarEnquiry } from '@/components/collection/SidebarEnquiry';
import { DestinationTile } from '@/components/home/sections';
import { SectionHeading } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { EnquireButton } from '@/components/enquiry/EnquireButton';

type Props = { params: Promise<{ slug: string }> };

/** Every valid slug is known at build time; anything else is a real 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return destinations.map(d => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = getDestination((await params).slug);
  return d ? { title: `Events, Weddings & Parties in ${d.name}`, description: d.about } : {};
}

export default async function DestinationPage({ params }: Props) {
  const dest = getDestination((await params).slug);
  if (!dest) notFound();

  const items = packages.filter(p => p.destination === dest.slug).sort((a, b) => b.reviewCount - a.reviewCount);
  const stats = collectionStats(items);
  const catSlugs = new Set(items.map(p => p.category));
  const chips = categories.filter(c => catSlugs.has(c.slug)).map(c => ({ value: c.slug, label: c.name }));
  const others = destinations.filter(d => d.slug !== dest.slug);

  return (
    <>
      <PageHero photo={dest.image} eyebrow={dest.international ? 'International destination' : 'Destination'} title={`Events in ${dest.name}`}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Destinations', href: '/destinations' }, { label: dest.name }]}>
        <p className="mt-3 max-w-2xl text-lg opacity-90">{dest.about}</p>
        <div className="mt-4 flex flex-wrap gap-5 text-sm opacity-90">
          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{dest.region}, {dest.country}</span>
          <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />Best time: {dest.bestTime}</span>
          <span className="flex items-center gap-1.5"><Building className="h-4 w-4" />{dest.venues}+ partner venues</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="#packages" variant="light">View {items.length} packages</ButtonLink>
          <EnquireButton variant="ghost-light" context={{ destination: dest.slug, source: 'destination-hero' }}>Get a custom quote</EnquireButton>
        </div>
      </PageHero>
      <StatRow items={[
        { value: String(stats.count), label: 'Curated packages' },
        { value: stats.minPrice ? inrShort(stats.minPrice) : '—', label: 'Starting price' },
        { value: `${stats.avgRating} ★`, label: `${stats.reviews.toLocaleString('en-IN')} reviews` },
        { value: String(chips.length), label: 'Occasions available' },
      ]} />

      <section id="packages" className="scroll-mt-24 py-14">
        <div className="container grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <SectionHeading title={`Top packages in ${dest.name}`} className="mb-4"
              action={<ButtonLink href={`/packages?destination=${dest.slug}`} variant="link">Filter & sort →</ButtonLink>} />
            <FilterablePackages items={items} chipKey="category" chips={chips} enquiryContext={{ destination: dest.slug }} />
          </div>
          <SidebarEnquiry title={`Plan your event in ${dest.name}`} context={{ destination: dest.slug, source: `destination:${dest.slug}` }} />
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container">
          <SectionHeading eyebrow="What to celebrate here" title={`Celebrations in ${dest.name}`} />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {categories.map(c => (
              <DestinationTile key={c.slug} wide href={`/packages?category=${c.slug}&destination=${dest.slug}`} photo={c.image} title={c.name} subtitle={`in ${dest.name}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container">
          <SectionHeading eyebrow="Keep exploring" title="Other destinations you’ll love" />
          <div className="scrollbar-thin grid snap-x auto-cols-[70%] grid-flow-col gap-4 overflow-x-auto pb-2 sm:auto-cols-[calc((100%-3rem)/4)]">
            {others.map(d => <DestinationTile key={d.slug} href={`/destinations/${d.slug}`} photo={d.image} title={d.name} subtitle={d.country === 'India' ? d.region : d.country} />)}
          </div>
        </div>
      </section>
    </>
  );
}
