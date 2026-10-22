import { Check, X } from 'lucide-react';
import type { EventPackage } from '@/types';
import { formatDate } from '@/lib/format';
import { Accordion, Stars } from '@/components/ui/misc';

const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="mb-4 font-serif text-[1.45rem] font-bold">{children}</h2>;

export function Section({ id, title, children, last }: { id: string; title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section id={id} className={`scroll-mt-32 py-8 ${last ? '' : 'border-b border-line'}`}>
      <H2>{title}</H2>
      {children}
    </section>
  );
}

export function Highlights({ pkg }: { pkg: EventPackage }) {
  return (
    <>
      <p className="mb-5 text-ink-600">{pkg.overview}</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {pkg.highlights.map(h => (
          <li key={h} className="flex gap-2.5 rounded-xl bg-white px-4 py-3.5 text-[0.92rem] font-medium"><span className="text-gold">✦</span>{h}</li>
        ))}
      </ul>
    </>
  );
}

export function InclusionsList({ pkg }: { pkg: EventPackage }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <h3 className="mb-3 font-sans text-base font-bold">Included</h3>
        <ul className="space-y-2.5">{pkg.inclusions.map(i => <li key={i} className="flex gap-2.5 text-[0.92rem]"><Check className="h-4 w-4 flex-none text-success" />{i}</li>)}</ul>
      </div>
      <div>
        <h3 className="mb-3 font-sans text-base font-bold">Not included</h3>
        <ul className="space-y-2.5">{pkg.exclusions.map(i => <li key={i} className="flex gap-2.5 text-[0.92rem]"><X className="h-4 w-4 flex-none text-danger" />{i}</li>)}</ul>
      </div>
    </div>
  );
}

export function Timeline({ pkg }: { pkg: EventPackage }) {
  return (
    <ol className="relative ml-2 border-l-2 border-cream-200 pl-7">
      {pkg.timeline.map(t => (
        <li key={t.title} className="relative pb-6 last:pb-0">
          <span className="absolute -left-[37px] top-1 h-4 w-4 rounded-full border-[3px] border-gold bg-cream" />
          <span className="text-xs font-bold uppercase tracking-wider text-gold">{t.when}</span>
          <h4 className="mb-1 mt-0.5 font-sans text-base font-bold">{t.title}</h4>
          <p className="text-[0.9rem] text-ink-400">{t.description}</p>
        </li>
      ))}
    </ol>
  );
}

export function Policies({ pkg }: { pkg: EventPackage }) {
  return <ul className="list-disc space-y-1.5 pl-5 text-ink-600">{pkg.policies.map(p => <li key={p}>{p}</li>)}</ul>;
}

export function Reviews({ pkg }: { pkg: EventPackage }) {
  const dist = [5, 4, 3, 2, 1].map(star => ({ star, pct: star === 5 ? 78 : star === 4 ? 17 : star === 3 ? 4 : 1 }));
  return (
    <>
      <div className="mb-6 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        <div>
          <div className="font-serif text-5xl font-bold text-brand-700">{pkg.rating.toFixed(1)}</div>
          <Stars value={pkg.rating} />
          <div className="text-sm text-ink-400">{pkg.reviewCount} verified bookings</div>
        </div>
        <div className="space-y-1.5">
          {dist.map(d => (
            <div key={d.star} className="flex items-center gap-3 text-sm">
              <span className="w-6">{d.star}★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-cream-200"><span className="block h-full rounded-full bg-gold" style={{ width: `${d.pct}%` }} /></span>
              <span className="w-9 text-right text-ink-400">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {pkg.reviews.map(r => (
          <article key={r.name} className="rounded-xl bg-white p-5">
            <header className="mb-2 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-cream-200 font-bold text-brand-700">{r.name[0]}</span>
              <div>
                <strong>{r.name}</strong>
                <div className="flex items-center gap-2 text-xs text-ink-400">{r.city} · {formatDate(r.date, { month: 'short', year: 'numeric' })} <Stars value={r.rating} className="[&_svg]:h-3 [&_svg]:w-3" /></div>
              </div>
            </header>
            <p className="text-[0.92rem] text-ink-600">{r.text}</p>
          </article>
        ))}
      </div>
    </>
  );
}

export function Faqs({ pkg }: { pkg: EventPackage }) {
  return <Accordion items={pkg.faqs} />;
}
