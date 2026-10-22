import { ArrowDown, ArrowUp } from 'lucide-react';
import type { analyticsOverview } from '@/lib/server/adminAnalytics';
import { formatDate, inr, inrShort } from '@/lib/format';
import { getCategory } from '@/lib/catalog';
import { cn } from '@/lib/cn';

export type DashboardData = Awaited<ReturnType<typeof analyticsOverview>>;

const CHANNELS: Record<string, string> = {
  direct: 'Direct', organic_search: 'Organic search', paid: 'Paid ads', email: 'Email', campaign: 'Campaigns',
  social: 'Social', referral: 'Referral', internal: 'Internal',
};

const num = (n: number) => Math.round(n).toLocaleString('en-IN');
const pct = (n: number, d = 1) => `${n.toFixed(d)}%`;

export function Dashboard({ data }: { data: DashboardData }) {
  const { kpis } = data;
  const tiles = [
    { label: 'Booking revenue', value: inrShort(kpis.revenue.value), m: kpis.revenue },
    { label: 'Bookings', value: num(kpis.bookings.value), m: kpis.bookings },
    { label: 'Enquiries', value: num(kpis.enquiries.value), m: kpis.enquiries },
    { label: 'Sessions', value: num(kpis.sessions.value), m: kpis.sessions },
    { label: 'Visitors', value: num(kpis.visitors.value), m: kpis.visitors },
    { label: 'Conversion rate', value: pct(kpis.conversionRate.value, 2), m: kpis.conversionRate },
  ];
  const totalSessions = data.channels.reduce((a, c) => a + c.sessions, 0);

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map(t => (
          <div key={t.label} className="rounded-xl bg-white p-4 shadow-card">
            <div className="text-sm text-ink-400">{t.label}</div>
            <div className="mt-1 text-2xl font-bold">{t.value}</div>
            <Delta value={t.m.value} previous={t.m.previous} />
          </div>
        ))}
      </div>

      <Card title="Sessions per day">
        <DailyBars points={data.daily.map(d => ({ date: d.date, value: d.sessions, note: `${d.bookings} bookings · ${d.enquiries} enquiries` }))} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Booking funnel" subtitle="Sessions reaching each step">
          <Bars rows={data.bookingFunnel.map(s => ({ label: s.step, value: s.sessions }))} max={data.bookingFunnel[0].sessions}
            display={(v, max) => `${num(v)} · ${pct(max ? (v / max) * 100 : 0, 0)}`} />
        </Card>
        <Card title="Traffic sources" subtitle="Sessions by channel">
          <Bars rows={data.channels.map(c => ({ label: CHANNELS[c.channel] ?? c.channel, value: c.sessions }))}
            display={v => `${num(v)} · ${pct(totalSessions ? (v / totalSessions) * 100 : 0, 0)}`} />
        </Card>
      </div>

      <Card title="Top packages" subtitle="Ranked by booking revenue">
        <Table
          head={['Package', 'Views', 'Add to cart', 'Enquiries', 'Bookings', 'Revenue']}
          rows={data.packages.slice(0, 10).map(p => [
            <div key="t"><div className="font-medium">{p.title}</div><div className="text-xs text-ink-400">{getCategory(p.category ?? '')?.name ?? '—'}</div></div>,
            num(p.views), num(p.carts), num(p.enquiries), num(p.bookings), <strong key="r">{inr(p.revenue)}</strong>,
          ])}
        />
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Latest bookings">
          <Table
            head={['Booking', 'Customer', 'Package', 'Event date', 'Total']}
            rows={data.recentBookings.slice(0, 10).map(b => [
              <div key="id"><div className="font-semibold">{b.id}</div><div className="text-xs text-ink-400">{formatDate(b.createdAt, { day: 'numeric', month: 'short' })}</div></div>,
              b.customer, <span key="p" className="line-clamp-1">{b.packageTitle}</span>, formatDate(b.eventDate, { day: 'numeric', month: 'short', year: 'numeric' }),
              <strong key="t">{inr(b.total)}</strong>,
            ])}
          />
        </Card>
        <Card title="Latest enquiries">
          <Table
            head={['Enquiry', 'Name', 'Phone', 'Interested in', 'Source']}
            rows={data.recentEnquiries.slice(0, 10).map(e => [
              <div key="id"><div className="font-semibold">{e.id}</div><div className="text-xs text-ink-400">{formatDate(e.createdAt, { day: 'numeric', month: 'short' })}</div></div>,
              e.name, <a key="ph" href={`tel:${e.phone}`} className="text-brand-700">{e.phone}</a>,
              <span key="i" className="line-clamp-1">{e.packageTitle ?? getCategory(e.category ?? '')?.name ?? '—'}</span>, e.source,
            ])}
          />
        </Card>
      </div>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl2 bg-white p-5 shadow-card">
      <h2 className="font-sans text-base font-bold">{title}</h2>
      {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Delta({ value, previous }: { value: number; previous: number }) {
  if (!previous) return <div className="mt-1 text-xs text-ink-400">{value ? 'New this period' : 'No data yet'}</div>;
  const change = ((value - previous) / previous) * 100;
  const up = change >= 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <div className="mt-1 flex items-center gap-1 text-xs">
      <span className={cn('flex items-center font-semibold', up ? 'text-success' : 'text-danger')}><Icon className="h-3 w-3" />{pct(Math.abs(change))}</span>
      <span className="text-ink-400">vs previous</span>
    </div>
  );
}

function Bars({ rows, max, display }: { rows: { label: string; value: number }[]; max?: number; display: (v: number, max: number) => string }) {
  const top = max ?? Math.max(0, ...rows.map(r => r.value));
  if (!rows.length || !top) return <p className="py-6 text-center text-sm text-ink-400">No data in this range yet.</p>;
  return (
    <ul className="space-y-3">
      {rows.map(r => (
        <li key={r.label}>
          <div className="mb-1 flex justify-between text-sm"><span>{r.label}</span><span className="font-semibold tabular-nums">{display(r.value, top)}</span></div>
          <div className="h-2 rounded bg-cream-100"><div className="h-2 rounded-r bg-brand-600" style={{ width: `${(r.value / top) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function DailyBars({ points }: { points: { date: string; value: number; note: string }[] }) {
  const max = Math.max(0, ...points.map(p => p.value));
  if (!max) return <p className="py-10 text-center text-sm text-ink-400">No sessions recorded in this range yet.</p>;
  return (
    <div>
      <div className="flex h-44 items-end gap-[2px] border-b border-line">
        {points.map(p => (
          <div key={p.date} className="group relative flex h-full flex-1 items-end" title={`${formatDate(p.date, { day: 'numeric', month: 'short' })}: ${num(p.value)} sessions · ${p.note}`}>
            <div className="w-full rounded-t-[3px] bg-brand-600 group-hover:bg-brand-700" style={{ height: `${(p.value / max) * 100}%`, minHeight: p.value ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-ink-400">
        <span>{formatDate(points[0].date, { day: 'numeric', month: 'short' })}</span>
        <span>Peak {num(max)}</span>
        <span>{formatDate(points[points.length - 1].date, { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-ink-400">Nothing in this range yet.</p>;
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-400">
            {head.map((h, i) => <th key={h} className={cn('pb-2 font-semibold', i > 0 && 'pl-4')}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line/60 last:border-0">
              {r.map((c, j) => <td key={j} className={cn('py-2.5 align-top tabular-nums', j > 0 && 'pl-4')}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
