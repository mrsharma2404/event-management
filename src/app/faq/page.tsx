import type { Metadata } from 'next';
import { faqs } from '@/lib/data/content';
import { Accordion, Breadcrumbs, SectionHeading } from '@/components/ui/misc';
import { EnquireButton } from '@/components/enquiry/EnquireButton';

export const metadata: Metadata = { title: 'Help & FAQs', description: 'Answers about booking, payments, cancellations and refunds at Crown & Co. Events.' };

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faqs.flatMap(g => g.items).map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return (
    <div className="container max-w-3xl py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Help & FAQs' }]} />
      <SectionHeading className="mt-4" eyebrow="Help centre" title="Frequently asked questions" />
      {faqs.map(g => (
        <section key={g.group} id={g.group.toLowerCase()} className="mb-10 scroll-mt-24">
          <h2 className="mb-4 font-serif text-xl font-bold">{g.group}</h2>
          <Accordion items={g.items} defaultOpen={-1} />
        </section>
      ))}
      <div className="mb-10 rounded-xl2 bg-cream-100 p-6 text-center">
        <h3 className="mb-1 font-serif text-xl font-bold">Still have questions?</h3>
        <p className="mb-4 text-ink-600">Our planners are happy to help.</p>
        <EnquireButton context={{ source: 'faq' }}>Talk to a planner</EnquireButton>
      </div>
    </div>
  );
}
