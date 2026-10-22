import { pageTypeFor, pathContext, type EventName, type EventProps } from './events';

/**
 * Browser-side tracker. Events are queued and sent to /api/events in small batches; anything still
 * queued when the tab is hidden or closed goes out via sendBeacon so exit events aren't lost.
 *
 * Identity:  anonymous_id (localStorage, long-lived) → session_id (30 min inactivity or a new campaign)
 *            → user_id (set by identify() after login).
 */

const ANON_KEY = 'cc:anon';
const SESSION_KEY = 'cc:session';
const SESSION_TIMEOUT_MS = 30 * 60_000;
const FLUSH_INTERVAL_MS = 2_000;
const MAX_BATCH = 20;
const ENDPOINT = '/api/events';

export interface SessionInfo {
  id: string;
  number: number;
  startedAt: number;
  lastSeen: number;
  landingPage: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  source_channel: string;
  /** Set once the landing-page events for this session have been sent (survives full page loads). */
  landingTracked?: boolean;
}

export interface QueuedEvent {
  id: string;
  name: EventName;
  ts: string;
  props: EventProps;
  context: Record<string, unknown>;
}

interface Traits {
  userId: string | null;
  isLoggedIn: boolean;
  customerSegment: string;
}

const isBrowser = typeof window !== 'undefined';
const debug = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === '1';

let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;
let traits: Traits = { userId: null, isLoggedIn: false, customerSegment: 'new' };
let session: SessionInfo | null = null;
/** Previous in-app URL, used as the referrer for client-side navigations. */
let lastUrl: string | null = null;
const onceKeys = new Set<string>();

const uuid = () =>
  crypto.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

function storage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function store(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode / quota */ }
}

export function anonymousId() {
  let id = storage<string>(ANON_KEY);
  if (!id) { id = uuid(); store(ANON_KEY, id); }
  return id;
}

const SEARCH_ENGINES = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|yandex|baidu)\./;
const SOCIAL = /(^|\.)(facebook|instagram|t\.co|twitter|x\.com|linkedin|youtube|pinterest|reddit|whatsapp)\b/;
const PAID_MEDIUMS = /^(cpc|ppc|paid|paid_social|paidsocial|display|cpm|banner|ads?)$/i;

function sourceChannel(utm: URLSearchParams, referrer: string | null) {
  const medium = utm.get('utm_medium') ?? '';
  if (utm.get('gclid') || utm.get('msclkid') || PAID_MEDIUMS.test(medium)) return 'paid';
  if (/^e-?mail$/i.test(medium)) return 'email';
  if (utm.get('utm_source')) return 'campaign';
  if (!referrer) return 'direct';
  const host = new URL(referrer).hostname;
  if (host === location.hostname) return 'internal';
  if (SEARCH_ENGINES.test(host)) return 'organic_search';
  if (SOCIAL.test(host)) return 'social';
  return 'referral';
}

/**
 * Returns the current session, starting a new one when the old one has expired or the visitor
 * arrives from a different campaign. Emits session_start / session_end / session_timeout.
 */
export function currentSession(): SessionInfo {
  const now = Date.now();
  const prev = session ?? storage<SessionInfo>(SESSION_KEY);
  const params = new URLSearchParams(location.search);
  const newCampaign = !!params.get('utm_campaign') && params.get('utm_campaign') !== prev?.utm_campaign;
  const expired = !prev || now - prev.lastSeen > SESSION_TIMEOUT_MS;

  if (prev && !expired && !newCampaign) {
    prev.lastSeen = now;
    session = prev;
    store(SESSION_KEY, prev);
    return prev;
  }

  if (prev) {
    const duration_ms = prev.lastSeen - prev.startedAt;
    enqueue('session_end', { duration_ms, ended_by: expired ? 'timeout' : 'new_campaign' }, prev, new Date(prev.lastSeen));
    // The tab stayed open past the timeout (as opposed to a fresh visit).
    if (expired && session) enqueue('session_timeout', { idle_ms: now - prev.lastSeen }, prev);
  }

  const referrer = document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : null;
  session = {
    id: uuid(),
    number: (prev?.number ?? 0) + 1,
    startedAt: now,
    lastSeen: now,
    landingPage: location.pathname + location.search,
    referrer,
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content'),
    source_channel: sourceChannel(params, referrer),
  };
  store(SESSION_KEY, session);
  enqueue('session_start', { session_number: session.number, is_returning: session.number > 1 }, session);
  return session;
}

function context(s: SessionInfo) {
  return {
    anonymous_id: anonymousId(),
    session_id: s.id,
    user_id: traits.userId,
    is_logged_in: traits.isLoggedIn,
    customer_segment: traits.customerSegment,
    page_url: location.href,
    page_path: location.pathname,
    page_type: pageTypeFor(location.pathname),
    page_title: document.title,
    referrer: lastUrl ?? (document.referrer || null),
    landing_page: s.landingPage,
    utm_source: s.utm_source,
    utm_medium: s.utm_medium,
    utm_campaign: s.utm_campaign,
    utm_term: s.utm_term,
    utm_content: s.utm_content,
    source_channel: s.source_channel,
    language: navigator.language,
    screen: `${screen.width}x${screen.height}`,
    viewport: `${innerWidth}x${innerHeight}`,
  };
}

function enqueue(name: EventName, props: EventProps, s: SessionInfo, at = new Date()) {
  // Events on a package/category/destination page default to that entity; explicit (defined) props win.
  const defined = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined));
  const event: QueuedEvent = { id: uuid(), name, ts: at.toISOString(), props: { ...pathContext(location.pathname), ...defined }, context: context(s) };
  if (debug) console.debug('[analytics]', name, props);
  queue.push(event);
  if (queue.length >= MAX_BATCH) flush();
  else if (!timer) timer = setTimeout(flush, FLUSH_INTERVAL_MS);
}

/** Record an event. Safe to call during SSR (no-op). */
export function track(name: EventName, props: EventProps = {}) {
  if (!isBrowser) return;
  try {
    enqueue(name, props, currentSession());
  } catch (e) {
    if (debug) console.warn('[analytics] track failed', e);
  }
}

/** Like track(), but at most once per key for the lifetime of the page (e.g. "viewed" events). */
export function trackOnce(key: string, name: EventName, props: EventProps = {}) {
  if (onceKeys.has(key)) return;
  onceKeys.add(key);
  track(name, props);
}

/** Clears trackOnce keys scoped to the current page, so they can fire again on the next page view. */
export function resetPageScope() {
  onceKeys.clear();
}

/** True exactly once per session: the caller should send landing-attribution events. */
export function claimLanding() {
  const s = currentSession();
  if (s.landingTracked) return false;
  s.landingTracked = true;
  store(SESSION_KEY, s);
  return true;
}

export function setLastUrl(url: string) {
  lastUrl = url;
}

export function identify(next: Partial<Traits>) {
  traits = { ...traits, ...next };
}

/** Ids attached to API calls so server-side conversion events land in the same session. */
export function visitorHeaders(): Record<string, string> {
  if (!isBrowser) return {};
  return { 'x-anonymous-id': anonymousId(), 'x-session-id': currentSession().id };
}

export function flush(useBeacon = false) {
  clearTimeout(timer);
  timer = undefined;
  if (!queue.length) return;
  const batch = queue.splice(0, MAX_BATCH);
  const body = JSON.stringify({ events: batch });

  if (useBeacon && navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'application/json' }))) {
    if (queue.length) flush(true);
    return;
  }
  fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true })
    .then(r => { if (r.status >= 500) throw new Error(String(r.status)); })
    .catch(() => {
      // Put the batch back for one more try; cap the queue so an outage can't grow it forever.
      queue = [...batch, ...queue].slice(0, 200);
      if (!timer) timer = setTimeout(flush, FLUSH_INTERVAL_MS * 5);
    });
  if (queue.length) timer = setTimeout(flush, 0);
}
