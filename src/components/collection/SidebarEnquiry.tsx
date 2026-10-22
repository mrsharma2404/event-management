import { Phone } from 'lucide-react';
import { EnquiryForm } from '@/components/enquiry/EnquiryForm';

export function SidebarEnquiry({ title, context }: { title: string; context: { category?: string; destination?: string; source: string } }) {
  return (
    <aside className="lg:sticky lg:top-[92px]">
      <div className="rounded-xl2 border-t-4 border-gold bg-white p-6 shadow-card">
        <h3 className="font-serif text-xl font-bold">{title}</h3>
        <p className="mb-4 text-sm text-ink-400">Free consultation · 3 options in 2 hours</p>
        <EnquiryForm context={context} compact idPrefix="side" />
      </div>
      <a href="tel:+919876543210" className="mt-3.5 flex items-center gap-3 rounded-xl bg-cream-100 p-4 text-sm">
        <Phone className="h-5 w-5 text-brand-700" />
        <span><strong>Prefer to talk?</strong><br />Call +91 98765 43210 (9am–9pm)</span>
      </a>
    </aside>
  );
}
