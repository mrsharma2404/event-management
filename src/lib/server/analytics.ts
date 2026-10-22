import 'server-only';
import type { EventName, EventProps } from '@/lib/analytics/events';
import { pageTypeFor } from '@/lib/analytics/events';
import { sql } from './neon';
import type { Attribution } from './db';

/** A fully-resolved row for analytics_events. */
export interface EventRow {
  id: string;
  event_name: EventName;
  occurred_at: string;
  anonymous_id: string;
  session_id: string;
  user_id: string | null;
  is_logged_in: boolean;
  customer_segment: string | null;
  page_url: string | null;
  page_path: string | null;
  page_type: string | null;
  referrer: string | null;
  landing_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  source_channel: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  language: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  pincode: string | null;
  package_slug: string | null;
  category: string | null;
  destination: string | null;
  properties: EventProps;
}

export const BOT_UA = /bot|crawler|spider|crawling|headless|lighthouse|pingdom|preview|vercel-screenshot/i;

export function parseUserAgent(ua: string) {
  const device_type = /iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua) ? 'tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'mobile' : 'desktop';
  const browser =
    /Edg\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
    : /Firefox|FxiOS/.test(ua) ? 'Firefox'
    : /Chrome|CriOS/.test(ua) ? 'Chrome'
    : /Safari/.test(ua) ? 'Safari'
    : 'Other';
  const os =
    /Windows/.test(ua) ? 'Windows'
    : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
    : /Mac OS X/.test(ua) ? 'macOS'
    : /Android/.test(ua) ? 'Android'
    : /CrOS/.test(ua) ? 'ChromeOS'
    : /Linux/.test(ua) ? 'Linux'
    : 'Other';
  return { device_type, browser, os };
}

/** Geo headers added by Vercel's edge network (absent in local dev). */
export function geoFromHeaders(h: Headers) {
  const get = (k: string) => {
    const v = h.get(k);
    try { return v ? decodeURIComponent(v) : null; } catch { return v; }
  };
  return {
    country: get('x-vercel-ip-country'),
    state: get('x-vercel-ip-country-region'),
    city: get('x-vercel-ip-city'),
    pincode: get('x-vercel-ip-postal-code'),
  };
}

export function attributionFromHeaders(h: Headers): Attribution {
  const clean = (v: string | null) => (v && /^[\w-]{8,64}$/.test(v) ? v : null);
  return { anonymousId: clean(h.get('x-anonymous-id')), sessionId: clean(h.get('x-session-id')) };
}

export async function insertEvents(rows: EventRow[]) {
  if (!rows.length) return;
  // One round trip: the batch goes in as a single jsonb parameter and is expanded server-side.
  await sql`
    INSERT INTO analytics_events (
      id, event_name, occurred_at, anonymous_id, session_id, user_id, is_logged_in, customer_segment,
      page_url, page_path, page_type, referrer, landing_page,
      utm_source, utm_medium, utm_campaign, utm_term, utm_content, source_channel,
      device_type, browser, os, language, country, state, city, pincode,
      package_slug, category, destination, properties
    )
    SELECT
      id, event_name, occurred_at, anonymous_id, session_id, user_id, is_logged_in, customer_segment,
      page_url, page_path, page_type, referrer, landing_page,
      utm_source, utm_medium, utm_campaign, utm_term, utm_content, source_channel,
      device_type, browser, os, language, country, state, city, pincode,
      package_slug, category, destination, coalesce(properties, '{}'::jsonb)
    FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS x(
      id uuid, event_name text, occurred_at timestamptz, anonymous_id text, session_id text, user_id text,
      is_logged_in boolean, customer_segment text, page_url text, page_path text, page_type text,
      referrer text, landing_page text, utm_source text, utm_medium text, utm_campaign text,
      utm_term text, utm_content text, source_channel text, device_type text, browser text, os text,
      language text, country text, state text, city text, pincode text,
      package_slug text, category text, destination text, properties jsonb
    )
    ON CONFLICT (id) DO NOTHING`;
}

/**
 * Records a conversion from a route handler. These are the source of truth for bookings/leads,
 * because client-side success events can be lost (ad blockers, closed tabs).
 * Never throws: analytics must not break the request that triggered it.
 */
export async function trackServer(req: Request, name: EventName, props: EventProps & { package_slug?: string; category?: string; destination?: string }) {
  try {
    const h = req.headers;
    const attr = attributionFromHeaders(h);
    const referer = h.get('referer');
    const path = referer ? new URL(referer).pathname : null;
    const { package_slug = null, category = null, destination = null, ...rest } = props;
    await insertEvents([{
      id: crypto.randomUUID(),
      event_name: name,
      occurred_at: new Date().toISOString(),
      anonymous_id: attr.anonymousId ?? 'server',
      session_id: attr.sessionId ?? 'server',
      user_id: null,
      is_logged_in: false,
      customer_segment: null,
      page_url: referer,
      page_path: path,
      page_type: path ? pageTypeFor(path) : null,
      referrer: null,
      landing_page: null,
      utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null,
      source_channel: 'server',
      ...parseUserAgent(h.get('user-agent') ?? ''),
      language: h.get('accept-language')?.split(',')[0] ?? null,
      ...geoFromHeaders(h),
      package_slug, category, destination,
      properties: { ...rest, emitted_by: 'server' },
    }]);
  } catch (e) {
    console.error(`[analytics] failed to record ${name}`, e);
  }
}
