import type { Metadata } from 'next';
import { Award, HeartHandshake, Sparkles, Users } from 'lucide-react';
import { stats } from '@/lib/data/content';
import { PHOTOS } from '@/lib/data/images';
import { PageHero } from '@/components/collection/PageHero';
import { SectionHeading } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'About Us', description: 'Crown & Co. Events is India’s celebration marketplace — curated packages, verified vendors and dedicated planners.' };

export default function AboutPage() {
  const values = [
    { icon: Sparkles, title: 'Every detail, considered', text: 'We obsess over the small things so your day feels effortless.' },
    { icon: HeartHandshake, title: 'Honest pricing', text: 'Itemised quotes and no surprise add-ons — ever.' },
    { icon: Users, title: 'People first', text: 'One dedicated planner who knows your story, start to finish.' },
    { icon: Award, title: 'Verified partners', text: 'Every venue and vendor is audited before joining our network.' },
  ];
  return (
    <>
      <PageHero photo={PHOTOS.banquet} eyebrow="Our story" title="We make celebrations effortless"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'About us' }]}>
        <p className="mt-3 max-w-2xl text-lg opacity-90">Founded in 2019, Crown & Co. Events brings India’s best venues, decorators, caterers and artists onto one platform — so you can book with confidence or let our planners build something unique.</p>
      </PageHero>
      <section className="py-16">
        <div className="container grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map(s => <div key={s.label} className="rounded-xl2 bg-white p-6 text-center shadow-card"><div className="font-serif text-3xl font-bold text-brand-700">{s.value}</div><div className="text-sm text-ink-400">{s.label}</div></div>)}
        </div>
      </section>
      <section className="bg-white py-16">
        <div className="container">
          <SectionHeading eyebrow="What we believe" title="Our values" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(v => <div key={v.title}><v.icon className="mb-3 h-8 w-8 text-brand-700" /><h3 className="mb-1 font-sans font-bold">{v.title}</h3><p className="text-sm text-ink-400">{v.text}</p></div>)}
          </div>
        </div>
      </section>
      <section id="terms" className="scroll-mt-24 py-16">
        <div className="container max-w-3xl space-y-8 text-ink-600">
          <div>
            <h2 className="mb-3 font-serif text-2xl font-bold text-ink">Terms of service</h2>
            <p>Bookings are confirmed on receipt of the advance payment. Package inclusions are as listed on the package page at the time of booking. Crown & Co. Events acts as the organiser and is responsible for delivery by its vendor partners.</p>
          </div>
          <div id="privacy" className="scroll-mt-24">
            <h2 className="mb-3 font-serif text-2xl font-bold text-ink">Privacy</h2>
            <p>We use your contact details only to plan your event and send booking updates. We never sell your data. You can ask us to delete your information at any time by writing to privacy@crownandcoevents.in.</p>
          </div>
          <ButtonLink href="/contact">Get in touch</ButtonLink>
        </div>
      </section>
    </>
  );
}
