import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isEventName, type EventName } from '@/lib/analytics/events';
import { BOT_UA, geoFromHeaders, insertEvents, parseUserAgent, type EventRow } from '@/lib/server/analytics';
import { badRequest } from '@/lib/server/http';

const MAX_BODY_BYTES = 64 * 1024;
const str = (max: number) => z.string().max(max).nullish().transform(v => v ?? null);
const scalar = z.union([z.string().max(500), z.number(), z.boolean(), z.null(), z.array(z.string().max(200)).max(50)]);

const eventSchema = z.object({
  id: z.string().uuid(),
  name: z.string().refine(isEventName, 'Unknown event name'),
  ts: z.string().datetime(),
  props: z.record(scalar).refine(p => Object.keys(p).length <= 40, 'Too many properties').default({}),
  context: z.object({
    anonymous_id: z.string().min(8).max(64),
    session_id: z.string().min(8).max(64),
    user_id: str(64),
    is_logged_in: z.boolean().default(false),
    customer_segment: str(32),
    page_url: str(2000),
    page_path: str(500),
    page_type: str(40),
    referrer: str(2000),
    landing_page: str(2000),
    utm_source: str(200),
    utm_medium: str(200),
    utm_campaign: str(200),
    utm_term: str(200),
    utm_content: str(200),
    source_channel: str(40),
    language: str(40),
    screen: str(20),
    viewport: str(20),
  }),
});

const bodySchema = z.object({ events: z.array(eventSchema).min(1).max(50) });

/** Clamp client clocks: anything more than a day off is replaced with the server time. */
function occurredAt(ts: string) {
  const t = Date.parse(ts);
  return Math.abs(Date.now() - t) > 86_400_000 ? new Date().toISOString() : new Date(t).toISOString();
}

/** Batched ingestion endpoint for the browser tracker (fetch keepalive or navigator.sendBeacon). */
export async function POST(req: Request) {
  const ua = req.headers.get('user-agent') ?? '';
  if (BOT_UA.test(ua)) return new NextResponse(null, { status: 204 });

  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) return NextResponse.json({ message: 'Payload too large' }, { status: 413 });

  let json: unknown;
  try { json = JSON.parse(text); } catch { return badRequest('Invalid JSON'); }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return badRequest('Invalid events payload', parsed.error.issues.slice(0, 5));

  const device = parseUserAgent(ua);
  const geo = geoFromHeaders(req.headers);

  const rows: EventRow[] = parsed.data.events.map(({ id, name, ts, props, context: c }) => {
    const { package_slug, category, destination, ...properties } = props;
    return {
      id,
      event_name: name as EventName,
      occurred_at: occurredAt(ts),
      anonymous_id: c.anonymous_id,
      session_id: c.session_id,
      user_id: c.user_id,
      is_logged_in: c.is_logged_in,
      customer_segment: c.customer_segment,
      page_url: c.page_url,
      page_path: c.page_path,
      page_type: c.page_type,
      referrer: c.referrer,
      landing_page: c.landing_page,
      utm_source: c.utm_source,
      utm_medium: c.utm_medium,
      utm_campaign: c.utm_campaign,
      utm_term: c.utm_term,
      utm_content: c.utm_content,
      source_channel: c.source_channel,
      ...device,
      language: c.language,
      ...geo,
      package_slug: typeof package_slug === 'string' ? package_slug : null,
      category: typeof category === 'string' ? category : null,
      destination: typeof destination === 'string' ? destination : null,
      properties: { ...properties, screen: c.screen, viewport: c.viewport },
    };
  });

  try {
    await insertEvents(rows);
  } catch (e) {
    console.error('[analytics] insert failed', e);
    return NextResponse.json({ message: 'Could not store events' }, { status: 503 });
  }
  return NextResponse.json({ accepted: rows.length }, { status: 202 });
}
