import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Clock, MapPin, MessageCircle, Users, Zap } from 'lucide-react';
import { getCategory, getDestination, getPackage, packages, relatedPackages } from '@/lib/catalog';
import { guestLabel } from '@/lib/format';
import { unsplash } from '@/lib/data/images';
import { Breadcrumbs, RatingBadge, SectionHeading } from '@/components/ui/misc';
import { Gallery } from '@/components/package-detail/Gallery';
import { StickyTabs } from '@/components/package-detail/StickyTabs';
import { SelectionProvider } from '@/components/package-detail/SelectionContext';
import { TierSelector } from '@/components/package-detail/TierSelector';
import { BookingWidget, MobileBookingBar } from '@/components/package-detail/BookingWidget';
import { Faqs, Highlights, InclusionsList, Policies, Reviews, Section, Timeline } from '@/components/package-detail/sections';
import { TrackView } from '@/components/package-detail/TrackView';
import { TrackSectionViews } from '@/components/analytics/TrackSectionViews';
import { ShareButton } from '@/components/package-detail/ShareButton';
import { WishlistButton } from '@/components/packages/WishlistButton';
import { PackageCard } from '@/components/packages/PackageCard';
import { RecentlyViewed } from '@/components/home/RecentlyViewed';
import Link from 'next/link';

type Props = { params: Promise<{ slug: string }> };

/** Every valid slug is known at build time; anything else is a real 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return packages.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pkg = getPackage((await params).slug);
  if (!pkg) return {};
  return {
    title: pkg.title,
    description: `${pkg.highlights.join(' · ')}. Starting ₹${pkg.price.toLocaleString('en-IN')}. Rated ${pkg.rating}/5.`,
    openGraph: { images: [unsplash(pkg.images[0], 1200)] },
  };
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'packages', label: 'Packages' },
  { id: 'inclusions', label: 'Inclusions' },
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'policies', label: 'Policies' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'faqs', label: 'FAQs' },
];

export default async function PackagePage({ params }: Props) {
  const pkg = getPackage((await params).slug);
  if (!pkg) notFound();
  const cat = getCategory(pkg.category)!;
  const dest = getDestination(pkg.destination)!;
  const similar = relatedPackages(pkg);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pkg.title,
    image: pkg.images.map(i => unsplash(i, 1200)),
    description: pkg.overview,
    brand: { '@type': 'Brand', name: 'Crown & Co. Events' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: pkg.rating, reviewCount: pkg.reviewCount },
    offers: { '@type': 'Offer', priceCurrency: 'INR', price: pkg.price, availability: 'https://schema.org/InStock' },
  };

  return (
    <SelectionProvider pkg={pkg}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackView slug={pkg.slug} props={{
        event_name: pkg.title, category: pkg.category, destination: pkg.destination, city: dest.name,
        price_min: pkg.price, price_max: Math.max(...pkg.tiers.map(t => t.price)), mrp: pkg.mrp, currency: 'INR',
        rating: pkg.rating, review_count: pkg.reviewCount, ticket_type_count: pkg.tiers.length,
        booking_mode: pkg.enquiryFirst ? 'enquiry_first' : 'instant',
      }} />
      <TrackSectionViews sections={{
        overview: 'event_highlights_viewed',
        packages: 'ticket_type_viewed',
        inclusions: 'event_included_items_viewed',
        itinerary: 'event_schedule_viewed',
        policies: ['policy_viewed', 'cancellation_policy_viewed', 'refund_policy_viewed'],
        reviews: ['event_review_viewed', 'rating_viewed'],
      }} />
      <div className="container pt-6">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' }, { label: cat.name, href: `/events/${cat.slug}` },
          { label: dest.name, href: `/destinations/${dest.slug}` }, { label: pkg.title },
        ]} />

        <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h1 className="mb-2 font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-bold leading-tight">{pkg.title}</h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-600">
              <span className="flex items-center gap-1.5"><RatingBadge rating={pkg.rating} /><a href="#reviews" data-track="review_count_viewed" data-track-review-count={pkg.reviewCount} className="underline">{pkg.reviewCount} reviews</a></span>
              <Link href={`/destinations/${dest.slug}`} className="flex items-center gap-1.5 hover:text-brand-700"><MapPin className="h-4 w-4" />{dest.name}{dest.region !== dest.name && `, ${dest.region}`}</Link>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{pkg.duration}</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{guestLabel(pkg.guests)}</span>
              <span className="flex items-center gap-1.5">{pkg.enquiryFirst ? <><MessageCircle className="h-4 w-4" />Custom quote recommended</> : <><Zap className="h-4 w-4" />Instant booking</>}</span>
            </div>
          </div>
          <div className="flex gap-2"><WishlistButton slug={pkg.slug} withLabel /><ShareButton title={pkg.title} /></div>
        </div>

        <Gallery photos={pkg.images} title={pkg.title} />

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_370px]">
          <div className="min-w-0">
            <StickyTabs tabs={TABS} />
            <Section id="overview" title="Overview"><Highlights pkg={pkg} /></Section>
            <Section id="packages" title="Choose your package">
              <p className="-mt-2 mb-4 text-sm text-ink-400">
                Prices include {pkg.guests.min === 2 && pkg.guests.max === 2 ? 'the couple' : `${pkg.guests.included} guests`}
                {pkg.perGuest ? `. Additional guests from ₹${pkg.perGuest.toLocaleString('en-IN')} each` : ''}.
              </p>
              <TierSelector />
            </Section>
            <Section id="inclusions" title="What’s included"><InclusionsList pkg={pkg} /></Section>
            <Section id="itinerary" title="How it flows"><Timeline pkg={pkg} /></Section>
            <Section id="policies" title="Payment & cancellation"><Policies pkg={pkg} /></Section>
            <Section id="reviews" title="Guest reviews"><Reviews pkg={pkg} /></Section>
            <Section id="faqs" title="FAQs" last><Faqs pkg={pkg} /></Section>
          </div>
          <aside className="lg:sticky lg:top-[92px]"><BookingWidget /></aside>
        </div>

        {similar.length > 0 && (
          <section className="py-14">
            <SectionHeading eyebrow="You may also like" title="Similar packages"
              action={<Link href={`/packages?category=${pkg.category}`} className="font-semibold text-brand-700 hover:underline">See more →</Link>} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{similar.map((p, i) => <PackageCard key={p.slug} pkg={p} position={i + 1} list="similar" />)}</div>
          </section>
        )}
      </div>
      <RecentlyViewed exclude={pkg.slug} />
      <MobileBookingBar />
    </SelectionProvider>
  );
}
