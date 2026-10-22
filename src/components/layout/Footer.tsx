import Link from 'next/link';
import { Lock, MessageCircle, ShieldCheck, Star } from 'lucide-react';
import { Logo } from './Logo';
import { categories, destinations } from '@/lib/catalog';
import { EnquireButton } from '@/components/enquiry/EnquireButton';
import { buttonClass } from '@/components/ui/Button';

export function CtaBand() {
  return (
    <section className="bg-gradient-to-r from-brand to-brand-600 py-14 text-ink">
      <div className="container flex flex-wrap items-center justify-between gap-8">
        <div>
          <h2 className="mb-1.5 font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-bold">Not sure where to start?</h2>
          <p className="text-ink-600">Share a few details and get 3 curated options with transparent pricing — free, within 2 hours.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <EnquireButton variant="dark" context={{ source: 'footer-cta' }}>Get Free Consultation</EnquireButton>
          <a className={buttonClass({ variant: 'ghost-dark' })} href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> WhatsApp Us
          </a>
        </div>
      </div>
    </section>
  );
}

const col = 'block py-1 text-sm opacity-80 transition hover:text-white hover:opacity-100';

export function Footer() {
  return (
    <footer className="bg-ink pt-16 text-cream-200">
      <div className="container grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 text-sm opacity-70">India’s celebration marketplace — book curated event packages instantly or let our planners craft something just for you.</p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs opacity-85">
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Secure payments</span>
            <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> 4.8/5 from 12k+ events</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Event protection</span>
          </div>
        </div>
        <div>
          <h4 className="mb-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand">Occasions</h4>
          {categories.map(c => <Link key={c.slug} className={col} href={`/events/${c.slug}`}>{c.name}</Link>)}
        </div>
        <div>
          <h4 className="mb-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand">Destinations</h4>
          {destinations.map(d => <Link key={d.slug} className={col} href={`/destinations/${d.slug}`}>{d.name}</Link>)}
        </div>
        <div>
          <h4 className="mb-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand">Company</h4>
          <Link className={col} href="/about">About us</Link>
          <Link className={col} href="/plan-my-event">Plan my event</Link>
          <Link className={col} href="/blog">Ideas & guides</Link>
          <Link className={col} href="/faq">Help & FAQs</Link>
          <Link className={col} href="/contact">Contact</Link>
          <Link className={col} href="/contact?topic=vendor">Become a vendor</Link>
        </div>
      </div>
      <div className="container mt-12 flex flex-wrap justify-between gap-3 border-t border-white/10 py-5 text-xs opacity-60">
        <span>© {new Date().getFullYear()} Crown & Co. Events Pvt. Ltd. All rights reserved.</span>
        <span className="flex gap-4"><Link href="/faq#cancellations">Cancellation policy</Link><Link href="/about#terms">Terms</Link><Link href="/about#privacy">Privacy</Link></span>
      </div>
    </footer>
  );
}

export function WhatsAppFab() {
  return (
    <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-white shadow-lift transition hover:scale-105 wa-fab">
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
