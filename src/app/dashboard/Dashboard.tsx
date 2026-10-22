import { ArrowDown, ArrowUp } from 'lucide-react';
import type { analyticsOverview, ModelRun } from '@/lib/server/adminAnalytics';
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

export function Dashboard({ data, model }: { data: DashboardData; model?: ModelRun | null }) {
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
      {model && <ModelCard run={model} />}
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

const FEATURE_LABELS: Record<string, string> = {
  active_seconds: 'Time spent browsing', avg_load_ms: 'Page load time', max_price_viewed: 'Highest package price viewed',
  n_detail_views: 'Package pages viewed', n_packages_viewed: 'Distinct packages viewed', n_page_views: 'Page views',
  n_events: 'Interactions', n_listing_views: 'Listing pages viewed', n_results_clicked: 'Results clicked',
  n_searches: 'Searches', n_filters: 'Filters / sorts used', n_gallery: 'Gallery views', n_reviews: 'Review views',
  n_faq: 'FAQs opened', n_price_views: 'Price views', n_tier_selects: 'Tier picks', n_date_selects: 'Date picks',
  n_wishlist: 'Wishlist adds', n_shares: 'Shares', n_contact_clicks: 'WhatsApp / call clicks', n_testimonials: 'Testimonials seen',
  is_returning: 'Returning visitor', is_weekend: 'Weekend visit', hour_ist: 'Hour of day',
};
const featureLabel = (f: string) =>
  FEATURE_LABELS[f] ?? f.replace(/^(channel|device|os|landing_type)_/, (_, k: string) => `${k.replace('_type', '')}: `).replace(/_/g, ' ');

/** Latest offline XGBoost run: headline verdict first, then metrics vs chance, drivers, and caveats. */
function ModelCard({ run }: { run: ModelRun }) {
  const xgb = run.metrics.models.xgboost;
  const lr = run.metrics.models.logistic_regression;
  const pt = run.metrics.permutation_test;
  const signal = pt ? pt.p_value < 0.05 : xgb.roc_auc.mean - xgb.roc_auc.std > 0.5;
  const metric = (label: string, value: string, sub: string, help: string) => (
    <div className="group relative rounded-xl bg-cream p-3.5" tabIndex={0}>
      <div className="flex items-center gap-1 text-xs text-ink-400">
        {label}
        <span aria-hidden className="grid h-3.5 w-3.5 place-items-center rounded-full border border-ink-400 text-[9px] font-bold leading-none">i</span>
      </div>
      <div role="tooltip" className="pointer-events-none invisible absolute left-0 top-full z-20 mt-2 w-72 rounded-lg bg-ink p-3 text-xs leading-relaxed text-cream opacity-0 shadow-lift transition group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100">
        {help}
      </div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-ink-400">{sub}</div>
    </div>
  );
  return (
    <section className="rounded-xl2 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-sans text-base font-bold">Conversion model · XGBoost baseline</h2>
          <p className="text-xs text-ink-400">
            Predicts whether a session ends in a booking or enquiry from browsing behaviour · trained {formatDate(run.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })} on {num(run.nSessions)} sessions
            ({num(run.nPositive)} converted)
          </p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', signal ? 'bg-success/10 text-success' : 'bg-cream-100 text-ink-600')}>
          {signal ? '✓ Predictive signal found' : pt && pt.p_value < 0.1 ? '◐ Promising signal' : '○ No reliable signal yet'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {metric('ROC-AUC (XGBoost)', `${xgb.roc_auc.mean.toFixed(2)} ± ${xgb.roc_auc.std.toFixed(2)}`, 'chance = 0.50',
          `How well the model ranks visits. Show it one visit that converted and one that didn't: it puts the converter higher ${Math.round(xgb.roc_auc.mean * 100)}% of the time. 0.5 is a coin flip, 1.0 is perfect. The ± shows how much it varied across test splits.`)}
        {metric('PR-AUC (XGBoost)', xgb.pr_auc.mean.toFixed(2), `chance = ${run.metrics.prevalence.toFixed(2)}`,
          `How precise the model is at finding converters among its top picks. Random guessing scores the conversion rate (${run.metrics.prevalence.toFixed(2)}); ${xgb.pr_auc.mean.toFixed(2)} means its top-ranked visits convert about ${(xgb.pr_auc.mean / run.metrics.prevalence).toFixed(1)}× more often than average.`)}
        {metric('ROC-AUC (logistic reg.)', lr.roc_auc.mean.toFixed(2), 'simpler baseline',
          'The same ranking score for a much simpler model (a weighted sum of the features). It is the yardstick: XGBoost is only worth its complexity if it beats this.')}
        {pt ? metric('Permutation test', `p = ${pt.p_value.toFixed(2)}`, `shuffled labels: ${pt.null_mean.toFixed(2)}`,
          `A significance check. We scramble which visits converted ${pt.permutations} times and retrain; those runs average ROC-AUC ${pt.null_mean.toFixed(2)}. p is the share of scrambled runs that score as well as the real data: below 0.05 means the pattern is very unlikely to be luck.`)
          : metric('Folds', `${run.metrics.folds} × ${run.metrics.repeats}`, 'stratified CV', 'How many train/test splits the scores are averaged over.')}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold">What the model leans on</h3>
          <Bars
            rows={run.topFeatures.slice(0, 6).map(f => ({ label: `${featureLabel(f.feature)} (${f.direction.includes('more') ? '↑' : '↓'})`, value: f.mean_abs_shap }))}
            display={v => v.toFixed(2)}
          />
          <p className="mt-2 text-xs text-ink-400">How much each behaviour moves the model’s prediction (mean |SHAP|). ↑ more of it raises the chance of converting, ↓ lowers it.</p>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">What this tells us</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-600">
            {run.caveats.map(c => <li key={c}>{c.replace(/^- /, '').replace(/\*/g, '').replace(/`/g, '')}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
