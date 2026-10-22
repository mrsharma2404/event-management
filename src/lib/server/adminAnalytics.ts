import 'server-only';
import { getPackage } from '@/lib/catalog';
import { sql } from './neon';

export class AdminInputError extends Error {}

/** Aggregates behind the admin dashboard. Every number is scoped to the requested [from, to] range (inclusive, in `tz`). */

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TZ = /^[A-Za-z]+(?:\/[A-Za-z_+-]+){0,2}$/;
const MAX_DAYS = 366;

const n = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

export const BOOKING_FUNNEL = [
  { event: 'event_detail_page_view', step: 'Viewed a package' },
  { event: 'checkout_started', step: 'Started checkout' },
  { event: 'booking_form_started', step: 'Started booking form' },
  { event: 'booking_form_submitted', step: 'Submitted details' },
  { event: 'payment_initiated', step: 'Initiated payment' },
  { event: 'booking_confirmed', step: 'Booking confirmed' },
];

export const ENQUIRY_FUNNEL = [
  { event: 'enquiry_form_viewed', step: 'Saw an enquiry form' },
  { event: 'enquiry_form_started', step: 'Started the form' },
  { event: 'enquiry_submit_attempted', step: 'Tried to submit' },
  { event: 'enquiry_confirmed', step: 'Enquiry received' },
];

export function parseRange(p: URLSearchParams) {
  const tz = p.get('tz') || 'Asia/Kolkata';
  const today = new Date().toISOString().slice(0, 10);
  const to = p.get('to') || today;
  const from = p.get('from') || new Date(Date.parse(to) - 29 * 86_400_000).toISOString().slice(0, 10);
  if (!DATE.test(from) || !DATE.test(to)) throw new AdminInputError('from/to must be YYYY-MM-DD');
  if (!TZ.test(tz)) throw new AdminInputError('Invalid tz');
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;
  if (days < 1 || days > MAX_DAYS) throw new AdminInputError(`Range must be 1–${MAX_DAYS} days`);
  return { from, to, tz, days };
}

type Range = ReturnType<typeof parseRange>;

async function bounds({ from, to, tz, days }: Range) {
  const [b] = await sql`
    SELECT (${from}::date::timestamp AT TIME ZONE ${tz}) AS start,
           ((${to}::date + 1)::timestamp AT TIME ZONE ${tz}) AS "end",
           ((${from}::date - ${days}::int)::timestamp AT TIME ZONE ${tz}) AS prev_start`;
  return { start: b.start, end: b.end, prevStart: b.prev_start };
}

async function kpis(start: unknown, end: unknown) {
  const [r] = await sql`
    WITH ev AS (SELECT * FROM analytics_events WHERE occurred_at >= ${start} AND occurred_at < ${end} AND session_id <> 'server'),
         bk AS (SELECT * FROM bookings WHERE created_at >= ${start} AND created_at < ${end} AND status = 'confirmed'),
         eq AS (SELECT * FROM enquiries WHERE created_at >= ${start} AND created_at < ${end})
    SELECT
      (SELECT count(DISTINCT anonymous_id) FROM ev) AS visitors,
      (SELECT count(DISTINCT session_id) FROM ev) AS sessions,
      (SELECT count(*) FROM ev WHERE event_name = 'page_view') AS page_views,
      (SELECT count(*) FROM bk) AS bookings,
      (SELECT coalesce(sum(total), 0) FROM bk) AS revenue,
      (SELECT coalesce(sum(amount_paid), 0) FROM bk) AS collected,
      (SELECT count(*) FROM eq) AS enquiries,
      (SELECT count(DISTINCT session_id) FROM (SELECT session_id FROM bk UNION SELECT session_id FROM eq) c
         WHERE session_id IN (SELECT session_id FROM ev)) AS converted_sessions`;
  const sessions = n(r.sessions);
  const bookings = n(r.bookings);
  const revenue = n(r.revenue);
  return {
    visitors: n(r.visitors),
    sessions,
    pageViews: n(r.page_views),
    bookings,
    revenue,
    collected: n(r.collected),
    enquiries: n(r.enquiries),
    conversionRate: sessions ? (n(r.converted_sessions) / sessions) * 100 : 0,
    avgOrderValue: bookings ? revenue / bookings : 0,
  };
}

export async function analyticsOverview(range: Range) {
  const { start, end, prevStart } = await bounds(range);
  const { from, to, tz } = range;
  const funnelEvents = [...BOOKING_FUNNEL, ...ENQUIRY_FUNNEL].map(s => s.event);

  const [current, previous, daily, funnel, channels, dims, pkgEvents, pkgBookings, pkgEnquiries, eventCounts, formErrors, heatmap, [quality], loadByType, recentBookings, recentEnquiries] =
    await Promise.all([
      kpis(start, end),
      kpis(prevStart, start),
      sql`
        WITH d AS (SELECT generate_series(${from}::date, ${to}::date, interval '1 day')::date AS day),
        ev AS (
          SELECT (occurred_at AT TIME ZONE ${tz})::date AS day,
                 count(DISTINCT session_id) FILTER (WHERE session_id <> 'server') AS sessions,
                 count(*) FILTER (WHERE event_name = 'page_view') AS page_views
          FROM analytics_events WHERE occurred_at >= ${start} AND occurred_at < ${end} GROUP BY 1),
        bk AS (
          SELECT (created_at AT TIME ZONE ${tz})::date AS day, count(*) AS bookings, sum(total) AS revenue
          FROM bookings WHERE created_at >= ${start} AND created_at < ${end} AND status = 'confirmed' GROUP BY 1),
        eq AS (
          SELECT (created_at AT TIME ZONE ${tz})::date AS day, count(*) AS enquiries
          FROM enquiries WHERE created_at >= ${start} AND created_at < ${end} GROUP BY 1)
        SELECT to_char(d.day, 'YYYY-MM-DD') AS date, ev.sessions, ev.page_views, bk.bookings, bk.revenue, eq.enquiries
        FROM d LEFT JOIN ev USING (day) LEFT JOIN bk USING (day) LEFT JOIN eq USING (day)
        ORDER BY d.day`,
      sql`
        SELECT event_name, count(DISTINCT session_id) AS sessions
        FROM analytics_events
        WHERE occurred_at >= ${start} AND occurred_at < ${end} AND event_name = ANY(${funnelEvents}) AND session_id <> 'server'
        GROUP BY 1`,
      sql`
        WITH conv AS (
          SELECT session_id FROM bookings WHERE created_at >= ${start} AND created_at < ${end}
          UNION SELECT session_id FROM enquiries WHERE created_at >= ${start} AND created_at < ${end})
        SELECT coalesce(s.source_channel, 'direct') AS channel, count(DISTINCT s.session_id) AS sessions,
               count(DISTINCT conv.session_id) AS conversions
        FROM analytics_events s LEFT JOIN conv ON conv.session_id = s.session_id
        WHERE s.event_name = 'session_start' AND s.occurred_at >= ${start} AND s.occurred_at < ${end}
        GROUP BY 1 ORDER BY 2 DESC`,
      sql`
        WITH s AS (SELECT * FROM analytics_events WHERE event_name = 'session_start' AND occurred_at >= ${start} AND occurred_at < ${end})
        SELECT 'device' AS dim, coalesce(device_type, 'unknown') AS name, count(*) AS n FROM s GROUP BY 2
        UNION ALL SELECT 'browser', coalesce(browser, 'Other'), count(*) FROM s GROUP BY 2
        UNION ALL SELECT 'os', coalesce(os, 'Other'), count(*) FROM s GROUP BY 2
        UNION ALL SELECT 'city', coalesce(city, 'Unknown'), count(*) FROM s GROUP BY 2
        UNION ALL SELECT 'landing', split_part(coalesce(landing_page, '/'), '?', 1), count(*) FROM s GROUP BY 2
        UNION ALL SELECT 'visitor', CASE WHEN properties->>'is_returning' = 'true' THEN 'returning' ELSE 'new' END, count(*) FROM s GROUP BY 2`,
      sql`
        SELECT package_slug AS slug,
               count(*) FILTER (WHERE event_name = 'event_viewed') AS views,
               count(DISTINCT session_id) FILTER (WHERE event_name = 'add_to_cart') AS carts,
               count(*) FILTER (WHERE event_name = 'wishlist_added') AS wishlists
        FROM analytics_events
        WHERE package_slug IS NOT NULL AND occurred_at >= ${start} AND occurred_at < ${end}
        GROUP BY 1`,
      sql`
        SELECT package_slug AS slug, count(*) AS bookings, sum(total) AS revenue
        FROM bookings WHERE created_at >= ${start} AND created_at < ${end} AND status = 'confirmed' GROUP BY 1`,
      sql`
        SELECT package_slug AS slug, count(*) AS enquiries
        FROM enquiries WHERE package_slug IS NOT NULL AND created_at >= ${start} AND created_at < ${end} GROUP BY 1`,
      sql`
        SELECT event_name AS name, count(*) AS n, count(DISTINCT session_id) AS sessions
        FROM analytics_events WHERE occurred_at >= ${start} AND occurred_at < ${end}
        GROUP BY 1 ORDER BY 2 DESC`,
      sql`
        SELECT CASE WHEN event_name = 'booking_form_validation_failed' THEN 'booking' ELSE coalesce(properties->>'form', 'other') END AS form,
               f AS field, count(*) AS n
        FROM analytics_events,
             jsonb_array_elements_text(CASE WHEN jsonb_typeof(properties->'fields') = 'array' THEN properties->'fields' ELSE '[]'::jsonb END) AS f
        WHERE event_name IN ('booking_form_validation_failed', 'form_error') AND occurred_at >= ${start} AND occurred_at < ${end}
        GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 20`,
      sql`
        SELECT extract(isodow FROM occurred_at AT TIME ZONE ${tz})::int AS dow,
               extract(hour FROM occurred_at AT TIME ZONE ${tz})::int AS hour, count(*) AS n
        FROM analytics_events WHERE event_name = 'session_start' AND occurred_at >= ${start} AND occurred_at < ${end}
        GROUP BY 1, 2`,
      sql`
        WITH t AS (
          SELECT event_name, CASE WHEN jsonb_typeof(properties->'load_ms') = 'number' THEN (properties->>'load_ms')::numeric END AS load_ms
          FROM analytics_events WHERE occurred_at >= ${start} AND occurred_at < ${end})
        SELECT percentile_cont(0.75) WITHIN GROUP (ORDER BY load_ms) FILTER (WHERE event_name = 'page_load_time') AS p75,
               avg(load_ms) FILTER (WHERE event_name = 'page_load_time') AS avg,
               count(*) FILTER (WHERE event_name = 'slow_page_detected') AS slow,
               count(*) FILTER (WHERE event_name = 'js_error') AS js,
               count(*) FILTER (WHERE event_name = 'api_error') AS api,
               count(*) FILTER (WHERE event_name = 'payment_failed') AS payment
        FROM t`,
      sql`
        SELECT coalesce(properties->>'page_type', 'other') AS page_type, count(*) AS n,
               avg(CASE WHEN jsonb_typeof(properties->'load_ms') = 'number' THEN (properties->>'load_ms')::numeric END) AS avg
        FROM analytics_events WHERE event_name = 'page_load_time' AND occurred_at >= ${start} AND occurred_at < ${end}
        GROUP BY 1 ORDER BY 2 DESC`,
      sql`
        SELECT id, created_at, package_slug, data->>'packageTitle' AS title, data->'contact'->>'name' AS customer,
               data->>'tier' AS tier, guests, to_char(event_date, 'YYYY-MM-DD') AS event_date, total, amount_paid, status,
               data->>'paymentMode' AS payment_mode
        FROM bookings WHERE created_at >= ${start} AND created_at < ${end}
        ORDER BY created_at DESC LIMIT 25`,
      sql`
        SELECT id, created_at, status, source, package_slug, category, destination, phone,
               data->>'name' AS name, data->>'budget' AS budget, data->>'guests' AS guests, data->>'date' AS event_date
        FROM enquiries WHERE created_at >= ${start} AND created_at < ${end}
        ORDER BY created_at DESC LIMIT 25`,
    ]);

  const funnelMap = new Map(funnel.map(r => [r.event_name as string, n(r.sessions)]));
  const toFunnel = (steps: typeof BOOKING_FUNNEL) => steps.map(s => ({ ...s, sessions: funnelMap.get(s.event) ?? 0 }));

  const dim = (name: string, limit = 10) =>
    dims.filter(r => r.dim === name).map(r => ({ name: r.name as string, sessions: n(r.n) }))
      .sort((a, b) => b.sessions - a.sessions).slice(0, limit);

  const bookingsBySlug = new Map(pkgBookings.map(r => [r.slug as string, r]));
  const enquiriesBySlug = new Map(pkgEnquiries.map(r => [r.slug as string, n(r.enquiries)]));
  const slugs = new Set([...pkgEvents.map(r => r.slug as string), ...bookingsBySlug.keys(), ...enquiriesBySlug.keys()]);
  const eventsBySlug = new Map(pkgEvents.map(r => [r.slug as string, r]));
  const packages = [...slugs].map(slug => {
    const p = getPackage(slug);
    const ev = eventsBySlug.get(slug);
    const bk = bookingsBySlug.get(slug);
    return {
      slug,
      title: p?.title ?? slug,
      category: p?.category ?? null,
      destination: p?.destination ?? null,
      price: p?.price ?? null,
      views: n(ev?.views),
      carts: n(ev?.carts),
      wishlists: n(ev?.wishlists),
      enquiries: enquiriesBySlug.get(slug) ?? 0,
      bookings: n(bk?.bookings),
      revenue: n(bk?.revenue),
    };
  }).sort((a, b) => b.revenue - a.revenue || b.views - a.views);

  return {
    range,
    generatedAt: new Date().toISOString(),
    kpis: Object.fromEntries(Object.entries(current).map(([k, v]) => [k, { value: v, previous: previous[k as keyof typeof previous] }])),
    daily: daily.map(r => ({
      date: r.date as string,
      sessions: n(r.sessions), pageViews: n(r.page_views), bookings: n(r.bookings), revenue: n(r.revenue), enquiries: n(r.enquiries),
    })),
    bookingFunnel: toFunnel(BOOKING_FUNNEL),
    enquiryFunnel: toFunnel(ENQUIRY_FUNNEL),
    channels: channels.map(r => ({ channel: r.channel as string, sessions: n(r.sessions), conversions: n(r.conversions) })),
    devices: dim('device'),
    browsers: dim('browser'),
    operatingSystems: dim('os'),
    cities: dim('city'),
    landingPages: dim('landing'),
    visitorTypes: dim('visitor'),
    packages,
    eventCounts: eventCounts.map(r => ({ name: r.name as string, count: n(r.n), sessions: n(r.sessions) })),
    formErrors: formErrors.map(r => ({ form: r.form as string, field: r.field as string, count: n(r.n) })),
    activity: heatmap.map(r => ({ dow: n(r.dow), hour: n(r.hour), sessions: n(r.n) })),
    quality: {
      p75LoadMs: quality.p75 === null ? null : Math.round(n(quality.p75)),
      avgLoadMs: quality.avg === null ? null : Math.round(n(quality.avg)),
      slowPages: n(quality.slow),
      jsErrors: n(quality.js),
      apiErrors: n(quality.api),
      paymentFailures: n(quality.payment),
      byPageType: loadByType.map(r => ({ pageType: r.page_type as string, views: n(r.n), avgLoadMs: Math.round(n(r.avg)) })),
    },
    recentBookings: recentBookings.map(r => ({
      id: r.id as string, createdAt: new Date(r.created_at as string).toISOString(), packageSlug: r.package_slug as string,
      packageTitle: (r.title as string) ?? getPackage(r.package_slug as string)?.title ?? r.package_slug, customer: r.customer as string,
      tier: r.tier as string, guests: n(r.guests), eventDate: r.event_date as string, total: n(r.total), amountPaid: n(r.amount_paid),
      status: r.status as string, paymentMode: r.payment_mode as string,
    })),
    recentEnquiries: recentEnquiries.map(r => ({
      id: r.id as string, createdAt: new Date(r.created_at as string).toISOString(), status: r.status as string, source: r.source as string,
      packageSlug: r.package_slug as string | null, packageTitle: r.package_slug ? getPackage(r.package_slug as string)?.title ?? null : null,
      category: r.category as string | null, destination: r.destination as string | null, name: r.name as string, phone: r.phone as string,
      budget: r.budget as string | null, guests: r.guests ? Number(r.guests) : null, eventDate: (r.event_date as string) || null,
    })),
  };
}

export interface ModelRun {
  createdAt: string;
  model: string;
  nSessions: number;
  nPositive: number;
  nSeed: number;
  includeSeed: boolean;
  metrics: {
    folds: number;
    repeats: number;
    prevalence: number;
    models: Record<string, { roc_auc: { mean: number; std: number }; pr_auc: { mean: number; std: number } }>;
    permutation_test?: { permutations: number; null_mean: number; null_p05: number; null_p95: number; p_value: number };
  };
  topFeatures: { feature: string; mean_abs_shap: number; direction: string }[];
  caveats: string[];
}

/** Latest offline training run (ml/conversion_model.py), or null if none has been recorded yet. */
export async function latestModelRun(): Promise<ModelRun | null> {
  try {
    const [r] = await sql`
      SELECT created_at, model, n_sessions, n_positive, n_seed, include_seed, metrics, top_features, caveats
      FROM ml_model_runs ORDER BY created_at DESC LIMIT 1`;
    if (!r) return null;
    return {
      createdAt: new Date(r.created_at as string).toISOString(), model: r.model as string, nSessions: n(r.n_sessions),
      nPositive: n(r.n_positive), nSeed: n(r.n_seed), includeSeed: r.include_seed as boolean,
      metrics: r.metrics as ModelRun['metrics'], topFeatures: r.top_features as ModelRun['topFeatures'], caveats: r.caveats as string[],
    };
  } catch {
    return null; // table not created yet
  }
}
