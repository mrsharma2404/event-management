import { SmartImage } from '@/components/ui/SmartImage';
import { Breadcrumbs, Eyebrow } from '@/components/ui/misc';

export function PageHero({ photo, eyebrow, title, children, crumbs }: {
  photo: string; eyebrow?: string; title: string; children?: React.ReactNode; crumbs: { label: string; href?: string }[];
}) {
  return (
    <section className="relative flex min-h-[380px] items-end overflow-hidden pb-14 pt-20 text-white">
      <SmartImage photo={photo} width={1800} fill priority sizes="100vw" alt="" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/35 via-ink/55 to-ink/85" />
      <div className="container relative">
        <div className="mb-4"><Breadcrumbs light items={crumbs} /></div>
        {eyebrow && <Eyebrow className="rounded-full bg-ink/55 px-3 py-1 text-brand backdrop-blur-sm">{eyebrow}</Eyebrow>}
        <h1 className="font-serif text-[clamp(2rem,4.5vw,3.3rem)] font-bold leading-tight">{title}</h1>
        {children}
      </div>
    </section>
  );
}

export function StatRow({ items }: { items: { value: string; label: string }[] }) {
  return (
    <div className="container -mt-8 relative z-10">
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {items.map(i => (
          <div key={i.label} className="rounded-[14px] bg-white p-4 shadow-card">
            <strong className="block text-2xl font-bold text-brand-700">{i.value}</strong>
            <span className="text-sm text-ink-400">{i.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
