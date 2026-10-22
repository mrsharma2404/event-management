import type { Metadata } from 'next';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/misc';
import { EnquiryForm } from '@/components/enquiry/EnquiryForm';

export const metadata: Metadata = { title: 'Contact Us', description: 'Talk to a Crown & Co. planner — call, WhatsApp, email or send us a message.' };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  const vendor = topic === 'vendor';
  const channels = [
    { icon: Phone, label: 'Call us', value: '+91 98765 43210', href: 'tel:+919876543210', note: 'Daily, 9am – 9pm' },
    { icon: MessageCircle, label: 'WhatsApp', value: 'Chat with a planner', href: 'https://wa.me/919876543210', note: 'Replies in minutes' },
    { icon: Mail, label: 'Email', value: vendor ? 'partners@crownandcoevents.in' : 'hello@crownandcoevents.in', href: `mailto:${vendor ? 'partners' : 'hello'}@crownandcoevents.in`, note: 'Replies within 4 hours' },
    { icon: MapPin, label: 'Office', value: 'Lower Parel, Mumbai 400013', href: 'https://maps.google.com/?q=Lower+Parel+Mumbai', note: 'Visits by appointment' },
  ];
  return (
    <div className="container py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
      <div className="mt-6 grid gap-10 pb-10 lg:grid-cols-2">
        <div>
          <h1 className="mb-3 font-serif text-[clamp(1.9rem,4vw,2.6rem)] font-bold">{vendor ? 'Partner with Crown & Co.' : 'We’d love to hear from you'}</h1>
          <p className="mb-8 text-lg text-ink-400">
            {vendor ? 'Venues, decorators, caterers, photographers and artists — join 2,500+ partners and get qualified leads every week.' : 'Questions about a package, a custom event or an existing booking? Reach us any way you like.'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {channels.map(c => (
              <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="rounded-xl2 bg-white p-5 shadow-card transition hover:-translate-y-0.5">
                <c.icon className="mb-2 h-6 w-6 text-brand-700" />
                <span className="block text-xs font-semibold uppercase tracking-wider text-ink-400">{c.label}</span>
                <strong className="block">{c.value}</strong>
                <span className="text-sm text-ink-400">{c.note}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="rounded-xl2 bg-white p-6 shadow-card sm:p-8">
          <h2 className="mb-1 font-serif text-2xl font-bold">{vendor ? 'Tell us about your business' : 'Send us a message'}</h2>
          <p className="mb-5 text-sm text-ink-400">We’ll get back within 2 hours during business hours.</p>
          <EnquiryForm showMessage idPrefix="contact" submitLabel="Send message" context={{ source: vendor ? 'vendor-signup' : 'contact-page' }} />
        </div>
      </div>
    </div>
  );
}
