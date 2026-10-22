import Link from 'next/link';
import {
  CalendarCheck, Gem, Handshake, Lock, MessageCircle, PartyPopper, ReceiptText, Search, ShieldCheck, Zap, Check,
} from 'lucide-react';
import { categories, destinations, packages } from '@/lib/catalog';
import { blogPosts, stats, testimonials } from '@/lib/data/content';
import { inrShort } from '@/lib/format';
import { PHOTOS } from '@/lib/data/images';
import { SmartImage } from '@/components/ui/SmartImage';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Eyebrow, SectionHeading, Stars } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';
import { EnquireButton } from '@/components/enquiry/EnquireButton';
import { PackageCard } from '@/components/packages/PackageCard';
import { HeroSearch } from './HeroSearch';

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-36 pt-16 text-white sm:pt-28">
      <SmartImage photo={PHOTOS.weddingKiss} width={1900} fill priority sizes="100vw" alt="" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/35 via-ink/55 to-ink/80" />
      <div className="container relative">
        <Eyebrow className="rounded-full bg-ink/55 px-3 py-1 text-brand backdrop-blur-sm">India’s celebration marketplace</Eyebrow>
        <h1 className="max-w-3xl font-serif text-[clamp(2.1rem,5vw,3.6rem)] font-bold leading-[1.1]">
          Every celebration deserves its <em className="text-brand">crowning</em> moment.
        </h1>
        <p className="mt-4 max-w-xl text-lg opacity-90">
          Book handpicked wedding, party and corporate event packages in minutes — or tell us your dream and our planners will craft it for you.
        </p>
        <HeroSearch />
        <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-4">
          {stats.map(s => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-serif text-3xl font-bold text-brand">{s.value}</dd>
              <dd className="text-sm opacity-85">{s.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function CategoryStrip() {
  return (
    <div className="container relative z-10 -mt-14">
      <div className="no-scrollbar grid grid-cols-4 gap-1 overflow-x-auto rounded-xl2 bg-white p-3 shadow-card sm:p-4 md:grid-cols-7">
        {categories.map(c => (
          <Link key={c.slug} href={`/events/${c.slug}`} className="group flex flex-col items-center gap-2 rounded-xl px-1 py-3 text-center text-[0.72rem] font-semibold sm:text-sm hover:text-brand-700">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-cream text-brand-700 transition group-hover:-translate-y-0.5 group-hover:bg-cream-200 sm:h-14 sm:w-14">
              <CategoryIcon name={c.icon} className="h-6 w-6" />
            </span>
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TrendingPackages() {
  const trending = [...packages].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8);
  return (
    <section className="py-16 sm:py-20">
      <div className="container">
        <SectionHeading eyebrow="Trending now" title="Most-booked packages this season"
          action={<Link href="/packages" className="font-semibold text-brand-700 hover:underline">View all packages →</Link>} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {trending.map((p, i) => <PackageCard key={p.slug} pkg={p} position={i + 1} list="home_trending" />)}
        </div>
      </div>
    </section>
  );
}

export function DestinationTile({ href, photo, title, subtitle, pill, wide }: { href: string; photo: string; title: string; subtitle: string; pill?: string; wide?: boolean }) {
  return (
    <Link href={href} className={`group relative isolate flex snap-start items-end overflow-hidden rounded-xl2 bg-cream-200 text-white ${wide ? 'aspect-[16/10]' : 'aspect-[3/4]'}`}>
      <SmartImage photo={photo} width={600} fill sizes="(max-width:640px) 80vw, 25vw" alt="" className="-z-20 transition duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-transparent to-ink/85" />
      {pill && <span className="absolute left-3.5 top-3.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink">{pill}</span>}
      <div className="p-5">
        <h3 className="font-serif text-xl font-bold">{title}</h3>
        <p className="text-sm opacity-90">{subtitle}</p>
      </div>
    </Link>
  );
}

export function DestinationCarousel() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="container">
        <SectionHeading eyebrow="Explore by destination" title="Where will you celebrate?"
          description="From Rajasthan’s palaces to Goa’s beaches — handpicked venues and local crews in every city."
          action={<Link href="/destinations" className="font-semibold text-brand-700 hover:underline">All destinations →</Link>} />
        <div className="scrollbar-thin grid snap-x snap-mandatory auto-cols-[78%] grid-flow-col gap-4 overflow-x-auto pb-2 sm:auto-cols-[calc((100%-2rem)/3)] lg:auto-cols-[calc((100%-3.375rem)/4)] lg:gap-[1.125rem]">
          {destinations.map(d => {
            const list = packages.filter(p => p.destination === d.slug);
            return (
              <DestinationTile key={d.slug} href={`/destinations/${d.slug}`} photo={d.image} title={d.name}
                subtitle={`${d.country === 'India' ? d.region : d.country} · from ${inrShort(Math.min(...list.map(p => p.price)))}`}
                pill={`${list.length} packages`} />
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function CategoryTiles() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container">
        <SectionHeading eyebrow="Explore by occasion" title="What are you celebrating?" />
        <div className="grid grid-cols-2 gap-3 sm:gap-[1.125rem] lg:grid-cols-4">
          {categories.map(c => (
            <DestinationTile key={c.slug} href={`/events/${c.slug}`} photo={c.image} title={c.name} subtitle={c.tagline} />
          ))}
          <Link href="/plan-my-event" className="flex aspect-[3/4] flex-col justify-end rounded-xl2 bg-gradient-to-br from-brand to-brand-600 p-5 text-ink transition hover:-translate-y-1">
            <PartyPopper className="mb-auto h-9 w-9 opacity-90" />
            <h3 className="font-serif text-xl font-bold">Something else?</h3>
            <p className="text-sm opacity-90">Housewarming, festival party, reunion… tell us and we’ll plan it →</p>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function TwoPaths() {
  const li = (t: string, light?: boolean) => (
    <li key={t} className="flex items-start gap-2.5"><Check className={`mt-0.5 h-4 w-4 flex-none ${light ? 'text-brand' : 'text-brand-600'}`} />{t}</li>
  );
  return (
    <section className="bg-cream-100 py-16 sm:py-20">
      <div className="container">
        <SectionHeading eyebrow="Two ways to plan" title="Book instantly, or let us plan it for you" />
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-xl2 bg-ink p-8 text-cream">
            <Zap className="mb-3 h-8 w-8 text-brand" />
            <h3 className="mb-1 font-serif text-2xl font-bold">Book a package</h3>
            <p className="text-cream-200">Know what you want? Pick a package, choose your date and lock it with just 20% advance.</p>
            <ul className="my-6 space-y-2">{['Transparent, all-inclusive pricing', 'Instant date confirmation', 'Pay 20% now, rest closer to the event', 'Extra 3% off when you pay in full'].map(t => li(t, true))}</ul>
            <ButtonLink href="/packages">Browse Packages</ButtonLink>
          </div>
          <div className="rounded-xl2 border-[1.5px] border-line bg-white p-8">
            <MessageCircle className="mb-3 h-8 w-8 text-brand-700" />
            <h3 className="mb-1 font-serif text-2xl font-bold">Get a custom quote</h3>
            <p className="text-ink-400">Big wedding or something unique? Share your vision and a dedicated planner will build it for you.</p>
            <ul className="my-6 space-y-2">{['Free 30-minute planning call', '3 curated options within 2 hours', 'Venue visits & vendor negotiations', 'One planner from start to finish'].map(t => li(t))}</ul>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/plan-my-event">Plan My Event</ButtonLink>
              <EnquireButton variant="outline" context={{ source: 'home-two-paths' }}>Quick Enquiry</EnquireButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { icon: Search, title: 'Discover', text: 'Browse packages by occasion or destination, with real prices and reviews.' },
    { icon: CalendarCheck, title: 'Customise', text: 'Pick a tier, date, guest count and add-ons — or ask for a custom quote.' },
    { icon: Lock, title: 'Reserve', text: 'Block your date with a 20% advance via UPI, card, net-banking or EMI.' },
    { icon: PartyPopper, title: 'Celebrate', text: 'Your planner and on-ground crew run the show. You just enjoy it.' },
  ];
  return (
    <section id="how" className="py-16 sm:py-20">
      <div className="container">
        <SectionHeading eyebrow="How it works" title="From idea to “that was perfect” in 4 steps" />
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-[14px] bg-white p-6 shadow-card">
              <span className="absolute right-5 top-3 font-serif text-4xl font-bold text-cream-200">0{i + 1}</span>
              <s.icon className="mb-3 h-8 w-8 text-brand-700" />
              <h3 className="mb-1 font-sans text-base font-bold">{s.title}</h3>
              <p className="text-sm text-ink-400">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function WhyUs() {
  const items = [
    { icon: Handshake, title: 'Dedicated planner', text: 'One point of contact, on WhatsApp, from day one.' },
    { icon: Gem, title: 'Verified vendors', text: '2,500+ venues, decorators and caterers vetted by us.' },
    { icon: ReceiptText, title: 'No hidden costs', text: 'Itemised quotes. What you see is what you pay.' },
    { icon: ShieldCheck, title: 'Event protection', text: 'Vendor no-show? We replace them at our cost.' },
  ];
  return (
    <section className="bg-white py-14">
      <div className="container grid grid-cols-2 gap-6 lg:grid-cols-4">
        {items.map(it => (
          <div key={it.title} className="text-center">
            <span className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-cream-100 text-brand-700"><it.icon className="h-7 w-7" /></span>
            <h4 className="mb-1 font-sans font-bold">{it.title}</h4>
            <p className="text-sm text-ink-400">{it.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section id="testimonials" className="py-16 sm:py-20">
      <div className="container">
        <SectionHeading eyebrow="Love notes" title="Stories from our celebrations" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map(t => (
            <figure key={t.name} className="overflow-hidden rounded-[14px] bg-white shadow-card">
              <div className="relative aspect-video"><SmartImage photo={t.image} width={600} fill sizes="(max-width:768px) 100vw, 25vw" alt="" /></div>
              <div className="p-5">
                <Stars value={5} />
                <blockquote className="my-3 font-serif text-[1.02rem] italic text-ink-600">“{t.text}”</blockquote>
                <figcaption><strong>{t.name}</strong><div className="text-sm text-ink-400">{t.context}</div></figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrustLogos() {
  return (
    <section className="bg-white py-10">
      <div className="container">
        <p className="mb-5 text-center text-xs font-semibold tracking-[0.2em] text-ink-400">TRUSTED BY TEAMS AT</p>
        <div className="flex flex-wrap justify-around gap-6 font-serif text-xl font-bold text-ink-600 opacity-60">
          {['Finly', 'Kraftwork', 'Nimbus', 'Orbit Labs', 'Zentra', 'Palette'].map(n => <span key={n}>{n}</span>)}
        </div>
      </div>
    </section>
  );
}

export function BlogTeaser() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container">
        <SectionHeading eyebrow="Ideas & guides" title="Plan smarter with our experts"
          action={<Link href="/blog" className="font-semibold text-brand-700 hover:underline">Read all →</Link>} />
        <div className="grid gap-5 md:grid-cols-3">
          {blogPosts.slice(0, 3).map(p => <BlogCard key={p.slug} post={p} />)}
        </div>
      </div>
    </section>
  );
}

export function BlogCard({ post }: { post: (typeof blogPosts)[number] }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group overflow-hidden rounded-[14px] bg-white shadow-card transition hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[16/9] overflow-hidden">
        <SmartImage photo={post.image} width={700} fill sizes="(max-width:768px) 100vw, 33vw" alt="" className="transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-gold">{post.category} · {post.readMinutes} min read</span>
        <h3 className="my-2 font-serif text-lg font-bold leading-snug group-hover:text-brand-700">{post.title}</h3>
        <p className="line-clamp-2 text-sm text-ink-400">{post.excerpt}</p>
      </div>
    </Link>
  );
}
