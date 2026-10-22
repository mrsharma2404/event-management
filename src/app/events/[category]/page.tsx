import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categories, collectionStats, destinations, getCategory, packages } from '@/lib/catalog';
import { inrShort } from '@/lib/format';
import { PageHero, StatRow } from '@/components/collection/PageHero';
import { FilterablePackages } from '@/components/collection/FilterablePackages';
import { SidebarEnquiry } from '@/components/collection/SidebarEnquiry';
import { DestinationTile } from '@/components/home/sections';
import { Accordion, SectionHeading } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { EnquireButton } from '@/components/enquiry/EnquireButton';

type Props = { params: Promise<{ category: string }> };

/** Every valid slug is known at build time; anything else is a real 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return categories.map(c => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = getCategory((await params).category);
  return c ? { title: `${c.name} Packages & Planners`, description: c.about } : {};
}

export default async function CategoryPage({ params }: Props) {
  const cat = getCategory((await params).category);
  if (!cat) notFound();

  const items = packages.filter(p => p.category === cat.slug).sort((a, b) => b.reviewCount - a.reviewCount);
  const stats = collectionStats(items);
  const destSlugs = [...new Set(items.map(p => p.destination))];
  const chips = destinations.filter(d => destSlugs.includes(d.slug)).map(d => ({ value: d.slug, label: d.name }));

  return (
    <>
      <PageHero photo={cat.image} eyebrow="Occasion" title={cat.name}
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Occasions', href: '/events' }, { label: cat.name }]}>
        <p className="mt-3 max-w-2xl text-lg opacity-90"><strong>{cat.tagline}.</strong> {cat.about}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="#packages" variant="light">View {items.length} packages</ButtonLink>
          <EnquireButton variant="ghost-light" context={{ category: cat.slug, source: 'category-hero' }}>Get a custom quote</EnquireButton>
        </div>
      </PageHero>
      <StatRow items={[
        { value: String(stats.count), label: 'Curated packages' },
        { value: stats.minPrice ? inrShort(stats.minPrice) : '—', label: 'Starting price' },
        { value: `${stats.avgRating} ★`, label: `${stats.reviews.toLocaleString('en-IN')} reviews` },
        { value: String(chips.length), label: 'Destinations' },
      ]} />

      <section id="packages" className="scroll-mt-24 py-14">
        <div className="container grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <SectionHeading title={`Popular ${cat.name.toLowerCase()} packages`} className="mb-4"
              action={<ButtonLink href={`/packages?category=${cat.slug}`} variant="link">Filter & sort →</ButtonLink>} />
            <FilterablePackages items={items} chipKey="destination" chips={chips} enquiryContext={{ category: cat.slug }} />
          </div>
          <SidebarEnquiry title={`Plan your ${cat.singular}`} context={{ category: cat.slug, source: `category:${cat.slug}` }} />
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container">
          <SectionHeading eyebrow="Where to host it" title={`${cat.name} by destination`} />
          <div className="scrollbar-thin grid snap-x auto-cols-[78%] grid-flow-col gap-4 overflow-x-auto pb-2 sm:auto-cols-[calc((100%-2rem)/3)] lg:auto-cols-[calc((100%-3rem)/4)]">
            {destinations.map(d => (
              <DestinationTile key={d.slug} wide href={`/packages?category=${cat.slug}&destination=${d.slug}`} photo={d.image} title={d.name} subtitle={`${cat.name} in ${d.name}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-3xl">
          <SectionHeading eyebrow="Good to know" title="Frequently asked questions" />
          <Accordion items={[
            { q: `How much does a ${cat.singular} cost?`, a: `Packages start at ${inrShort(stats.minPrice)} and vary with guest count, venue and decor tier. Every package shows an all-inclusive price before GST — or ask for a custom quote.` },
            { q: 'Can I book without speaking to anyone?', a: 'Yes. Choose a package, select your date and pay a 20% advance online. Your planner reaches out after booking to finalise details.' },
            { q: 'What if I need something not listed?', a: 'Send us an enquiry. Most of our events are customised — our planners work with 2,500+ verified vendors.' },
            { q: 'Is my advance refundable?', a: 'Cancellations 60+ days before the event get a 90% refund. See each package’s policy for details.' },
          ]} />
        </div>
      </section>
    </>
  );
}
