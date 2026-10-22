// Seeds realistic demo traffic into the database so the dashboard has something to show:
// ~100 visitors over the last 14 days, 1 booking and 10 enquiries, with full event journeys.
//
//   npm run db:seed-demo            # (re)seed — removes previous demo rows first
//   npm run db:seed-demo -- --clear # remove all demo rows only
//
// Every demo row is tagged (anonymous_id 'seed-…', properties.seed = true, ids CSSEED… / EQSEED…),
// so real data is never touched.
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL && existsSync('.env.local')) process.loadEnvFile('.env.local');
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to .env.local or pass it inline: DATABASE_URL=... npm run db:seed-demo');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
const SITE = process.env.SEED_SITE_URL ?? 'https://event-management-nu-brown.vercel.app';

async function clear() {
  const [e] = await sql`WITH d AS (DELETE FROM analytics_events WHERE anonymous_id LIKE 'seed-%' OR properties->>'seed' = 'true' RETURNING 1) SELECT count(*) AS n FROM d`;
  const [b] = await sql`WITH d AS (DELETE FROM bookings WHERE id LIKE 'CSSEED%' RETURNING 1) SELECT count(*) AS n FROM d`;
  const [q] = await sql`WITH d AS (DELETE FROM enquiries WHERE id LIKE 'EQSEED%' RETURNING 1) SELECT count(*) AS n FROM d`;
  console.log(`Removed demo data: ${e.n} events, ${b.n} bookings, ${q.n} enquiries.`);
}

if (process.argv.includes('--clear')) {
  await clear();
  process.exit(0);
}

// ---------- deterministic randomness ----------
let seed = 20261022;
const rnd = () => ((seed = (seed + 0x6d2b79f5) | 0), (((seed ^ (seed >>> 15)) * (seed | 1)) >>> 0) / 4294967296);
const pick = xs => xs[Math.floor(rnd() * xs.length)];
const weighted = pairs => {
  let r = rnd() * pairs.reduce((a, [, w]) => a + w, 0);
  for (const [v, w] of pairs) if ((r -= w) < 0) return v;
  return pairs[0][0];
};
const chance = p => rnd() < p;
const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));

// ---------- catalogue (subset of src/lib/data/packages.ts) ----------
const PACKAGES = [
  ['intimate-villa-wedding-goa', 'Intimate Villa Wedding in North Goa', 'weddings', 'goa', 290000, 8],
  ['royal-palace-wedding-jaipur', 'Royal Palace Wedding at a Jaipur Heritage Haveli', 'weddings', 'jaipur', 850000, 9],
  ['goa-beach-destination-wedding', 'Beachfront Destination Wedding in Goa', 'destination-weddings', 'goa', 980000, 7],
  ['taj-mahal-pre-wedding-shoot', 'Sunrise Pre-Wedding Shoot at the Taj Mahal', 'pre-wedding', 'agra', 45000, 7],
  ['kids-theme-birthday-mumbai', 'Kids’ Theme Birthday Party (Superheroes / Princess)', 'birthdays', 'mumbai', 35000, 6],
  ['mumbai-ballroom-wedding', 'Sea-Facing Ballroom Wedding in Mumbai', 'weddings', 'mumbai', 550000, 5],
  ['goa-beach-pre-wedding', 'Beach & Old-Goa Pre-Wedding Shoot', 'pre-wedding', 'goa', 42000, 5],
  ['corporate-offsite-himachal', '3-Day Leadership Offsite in the Himalayas', 'corporate', 'himachal', 420000, 4],
  ['milestone-birthday-goa', 'Milestone Birthday Weekend in Goa', 'birthdays', 'goa', 120000, 4],
  ['jaisalmer-fort-destination-wedding', 'Golden Fort Destination Wedding, Jaisalmer', 'destination-weddings', 'jaisalmer', 1450000, 3],
  ['taj-view-proposal-agra', 'Taj-View Rooftop Proposal Dinner', 'private-parties', 'agra', 28000, 4],
  ['private-live-band-mumbai', 'Private Live Band Night (Bollywood Retro)', 'concerts', 'mumbai', 95000, 3],
].map(([slug, title, category, destination, price, pull]) => ({ slug, title, category, destination, price, pull }));
const pickPackage = () => weighted(PACKAGES.map(p => [p, p.pull]));

const CHANNELS = [['organic_search', 40], ['direct', 22], ['paid', 15], ['social', 12], ['email', 6], ['referral', 5]];
const CITIES = [['Mumbai', 'MH', '400050', 22], ['Delhi', 'DL', '110017', 18], ['Bengaluru', 'KA', '560034', 14], ['Pune', 'MH', '411001', 9], ['Hyderabad', 'TG', '500081', 8], ['Jaipur', 'RJ', '302001', 7], ['Chennai', 'TN', '600017', 6], ['Kolkata', 'WB', '700019', 5], ['Ahmedabad', 'GJ', '380015', 4], ['Panaji', 'GA', '403001', 3]];
const DEVICES = [
  [{ device_type: 'mobile', browser: 'Chrome', os: 'Android' }, 40],
  [{ device_type: 'mobile', browser: 'Safari', os: 'iOS' }, 20],
  [{ device_type: 'mobile', browser: 'Samsung Internet', os: 'Android' }, 3],
  [{ device_type: 'desktop', browser: 'Chrome', os: 'Windows' }, 16],
  [{ device_type: 'desktop', browser: 'Chrome', os: 'macOS' }, 7],
  [{ device_type: 'desktop', browser: 'Safari', os: 'macOS' }, 5],
  [{ device_type: 'desktop', browser: 'Edge', os: 'Windows' }, 4],
  [{ device_type: 'tablet', browser: 'Safari', os: 'iOS' }, 5],
];
const NAMES = ['Aarav Mehta', 'Ananya Iyer', 'Vihaan Kapoor', 'Diya Sharma', 'Arjun Reddy', 'Isha Nair', 'Kabir Malhotra', 'Meera Desai', 'Rohan Gupta', 'Saanvi Rao', 'Priya Bose', 'Karan Singh'];
const BUDGETS = ['Under ₹1 Lakh', '₹1 – 5 Lakh', '₹5 – 15 Lakh', '₹15 – 50 Lakh'];

// ---------- event builder ----------
const events = [];
const DAY = 86_400_000;
const now = Date.now();

function pageTypeFor(path) {
  if (path === '/') return 'home';
  if (path === '/packages') return 'listing';
  if (path.startsWith('/packages/')) return 'event_detail';
  if (path.startsWith('/events')) return 'category';
  if (path.startsWith('/destinations')) return 'destination';
  if (path === '/checkout/booking') return 'checkout_booking';
  if (path === '/checkout/payment') return 'checkout_payment';
  if (path.startsWith('/checkout/confirmation')) return 'confirmation';
  if (path === '/plan-my-event') return 'plan_my_event';
  if (path.startsWith('/blog')) return 'blog';
  return 'content';
}

function makeSession(visitor, number, startAt) {
  const channel = number > 1 && chance(0.6) ? 'direct' : weighted(CHANNELS);
  const utm = channel === 'paid' ? { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'wedding-season' }
    : channel === 'email' ? { utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'october-offers' }
    : channel === 'social' ? { utm_source: 'instagram', utm_medium: 'social', utm_campaign: null } : {};
  const referrer = channel === 'organic_search' ? 'https://www.google.com/' : channel === 'social' ? 'https://l.instagram.com/' : channel === 'referral' ? 'https://www.weddingwire.in/' : null;
  const landing = channel === 'paid' ? `/packages/${pickPackage().slug}` : channel === 'organic_search' ? weighted([['/', 4], ['/events/weddings', 3], ['/blog/wedding-budget-breakdown-2026', 2], [`/packages/${pickPackage().slug}`, 3]]) : weighted([['/', 6], ['/packages', 2], ['/plan-my-event', 1]]);
  const s = { visitor, id: `seed-sess-${randomUUID()}`, number, t: startAt, landing, channel, utm, referrer, path: null, cart: null };
  const qs = utm.utm_source ? `?${new URLSearchParams(Object.entries(utm).filter(([, v]) => v))}` : '';
  s.landingPage = landing + qs;
  return s;
}

function emit(s, name, props = {}, extra = {}) {
  s.t += int(4, 70) * 1000;
  const path = s.path ?? s.landing;
  events.push({
    id: randomUUID(),
    event_name: name,
    occurred_at: new Date(s.t).toISOString(),
    anonymous_id: s.visitor.id,
    session_id: s.id,
    user_id: null,
    is_logged_in: false,
    customer_segment: s.number > 1 ? 'returning' : 'new',
    page_url: SITE + path,
    page_path: path,
    page_type: pageTypeFor(path),
    referrer: s.referrer,
    landing_page: s.landingPage,
    utm_source: s.utm.utm_source ?? null,
    utm_medium: s.utm.utm_medium ?? null,
    utm_campaign: s.utm.utm_campaign ?? null,
    utm_term: null,
    utm_content: null,
    source_channel: s.channel,
    ...s.visitor.device,
    language: 'en-IN',
    country: 'IN',
    state: s.visitor.city[1],
    city: s.visitor.city[0],
    pincode: s.visitor.city[2],
    package_slug: props.package_slug ?? (path.startsWith('/packages/') ? path.split('/')[2] : null),
    category: props.category ?? (path.startsWith('/events/') ? path.split('/')[2] : null),
    destination: props.destination ?? null,
    properties: { ...Object.fromEntries(Object.entries(props).filter(([k]) => !['package_slug', 'category', 'destination'].includes(k))), seed: true },
    ...extra,
  });
}

function visit(s, path) {
  const prev = s.path;
  s.path = path;
  const type = pageTypeFor(path);
  emit(s, 'page_view', { page_type: type, prev_page_path: prev ?? undefined });
  if (type === 'home') emit(s, 'home_page_view');
  if (['listing', 'category', 'destination'].includes(type)) emit(s, 'listing_page_view', { listing_type: type });
  if (type === 'event_detail') emit(s, 'event_detail_page_view');
  emit(s, 'page_load_time', { page_type: type, load_ms: int(700, 2600), ttfb_ms: int(60, 400) });
}

function browsePackage(s, pkg, depth) {
  visit(s, `/packages/${pkg.slug}`);
  emit(s, 'event_viewed', { package_slug: pkg.slug, category: pkg.category, destination: pkg.destination, price_min: pkg.price, currency: 'INR' });
  emit(s, 'event_highlights_viewed', { package_slug: pkg.slug, section: 'overview' });
  if (depth > 0.3) emit(s, 'ticket_type_viewed', { package_slug: pkg.slug, section: 'packages' });
  if (depth > 0.4) emit(s, 'price_breakdown_viewed', { package_slug: pkg.slug, tier: 'classic', currency: 'INR' });
  if (depth > 0.5 && chance(0.5)) emit(s, 'event_gallery_opened', { package_slug: pkg.slug, photo_index: 1 });
  if (depth > 0.6) emit(s, 'event_review_viewed', { package_slug: pkg.slug, section: 'reviews' });
  if (depth > 0.7 && chance(0.4)) emit(s, 'faq_viewed', { package_slug: pkg.slug });
  if (depth > 0.55 && chance(0.45)) emit(s, 'ticket_option_selected', { package_slug: pkg.slug, tier: pick(['classic', 'premium']) });
  if (depth > 0.65 && chance(0.4)) emit(s, 'date_selected', { package_slug: pkg.slug, days_ahead: int(30, 200) });
  if (chance(0.08)) emit(s, 'wishlist_added', { package_slug: pkg.slug, category: pkg.category, destination: pkg.destination });
  if (chance(0.05)) emit(s, 'event_share_clicked', { package_slug: pkg.slug, method: 'native' });
}

function enquire(s, enquiry) {
  const form = { form_source: enquiry.source, package_slug: enquiry.package?.slug };
  emit(s, 'enquiry_form_viewed', form);
  emit(s, 'enquiry_form_started', { ...form, first_field: 'name' });
  ['name', 'phone', 'category', 'budget'].forEach((f, i) => emit(s, 'enquiry_field_filled', { ...form, field_name: f, fields_completed: i + 1 }));
  emit(s, 'enquiry_submit_attempted', form);
  emit(s, 'enquiry_submitted', form);
  emit(s, 'enquiry_success', { ...form, enquiry_id: enquiry.id });
  const lead = { enquiry_id: enquiry.id, form_source: enquiry.source, package_slug: enquiry.package?.slug, category: enquiry.category, emitted_by: 'server' };
  emit(s, 'lead_created', lead);
  emit(s, 'enquiry_confirmed', lead);
}

// ---------- build ~100 visitors ----------
const visitors = Array.from({ length: 100 }, (_, i) => ({
  id: `seed-anon-${String(i + 1).padStart(3, '0')}-${randomUUID().slice(0, 8)}`,
  device: weighted(DEVICES),
  city: weighted(CITIES.map(c => [c, c[3]])),
}));

const sessions = [];
for (const v of visitors) {
  const count = weighted([[1, 72], [2, 22], [3, 6]]);
  let t = now - int(1, 14) * DAY;
  for (let n = 1; n <= count; n++) {
    const d = new Date(t);
    // Evening-heavy browsing in IST (UTC+5:30).
    const istHour = weighted([[10, 2], [12, 3], [13, 3], [15, 2], [18, 3], [20, 5], [21, 6], [22, 4], [23, 2]]);
    d.setUTCHours(istHour - 5, int(0, 59) - 30, int(0, 59), 0);
    if (d.getTime() > now - 3_600_000) d.setTime(now - int(2, 20) * 3_600_000);
    sessions.push(makeSession(v, n, d.getTime()));
    t = Math.min(now - DAY / 2, t + int(1, 4) * DAY);
  }
}
sessions.sort((a, b) => a.t - b.t);

// Pick which sessions convert: 10 enquiries (mixed sources), 1 booking, a few abandoned checkouts.
const shuffled = [...sessions].sort(() => rnd() - 0.5);
const enquirySessions = shuffled.slice(0, 10);
const bookingSession = shuffled.find(s => s.visitor.device.device_type === 'desktop' && !enquirySessions.includes(s));
const abandonSessions = shuffled.filter(s => !enquirySessions.includes(s) && s !== bookingSession).slice(0, 4);

const enquiries = [];
const SOURCES = ['package-widget', 'package-widget', 'plan-my-event', 'plan-my-event', 'header', 'category:weddings', 'listing-banner', 'package-widget', 'contact-page', 'mobile-bar'];

for (const s of sessions) {
  emit(s, 'session_start', { session_number: s.number, is_returning: s.number > 1 });
  visit(s, s.landing);
  if (s.landing === '/' && chance(0.5)) emit(s, 'testimonial_viewed', { section: 'testimonials' });

  const engaged = rnd();
  if (!s.landing.startsWith('/packages/') && engaged > 0.25) {
    if (chance(0.35)) emit(s, 'search_performed', { source: 'hero', category: pick(['weddings', 'birthdays', 'pre-wedding', undefined]), filters_applied: int(1, 2) });
    visit(s, chance(0.3) ? '/events/weddings' : '/packages');
    emit(s, 'listing_result_viewed', { list: 'packages', result_count: int(8, 31) });
    if (chance(0.4)) emit(s, 'filter_applied', { filter_name: pick(['categories', 'destinations', 'budget']), filter_value: pick(['weddings', 'goa', '50000-200000']), result_count: int(3, 12) });
    if (chance(0.15)) emit(s, 'sort_applied', { sort: 'price-asc', result_count: int(5, 20) });
    const pkg = pickPackage();
    emit(s, 'listing_result_clicked', { package_slug: pkg.slug, category: pkg.category, destination: pkg.destination, position: int(1, 9), list: 'packages' });
    browsePackage(s, pkg, engaged);
  } else if (s.landing.startsWith('/packages/')) {
    const pkg = PACKAGES.find(p => s.landing === `/packages/${p.slug}`);
    emit(s, 'event_viewed', { package_slug: pkg.slug, category: pkg.category, destination: pkg.destination, price_min: pkg.price, currency: 'INR' });
    if (engaged > 0.3) browsePackage(s, pickPackage(), engaged);
  }
  if (engaged > 0.75 && chance(0.5)) browsePackage(s, pickPackage(), engaged - 0.2);
  if (chance(0.06)) emit(s, pick(['whatsapp_click', 'call_click']), { link_text: 'Talk to an expert' });

  // Most people who open an enquiry form don't send it.
  if (!enquirySessions.includes(s) && chance(0.22)) {
    const form = { form_source: pick(['category:weddings', 'package-widget', 'header', 'contact-page']) };
    emit(s, 'enquiry_form_viewed', form);
    if (chance(0.4)) {
      emit(s, 'enquiry_form_started', { ...form, first_field: 'name' });
      emit(s, 'enquiry_field_filled', { ...form, field_name: 'name', fields_completed: 1 });
      if (chance(0.35)) {
        emit(s, 'enquiry_submit_attempted', form);
        emit(s, 'form_error', { ...form, form: 'enquiry', fields: [pick(['phone', 'phone', 'name'])] });
      }
    }
  }

  if (enquirySessions.includes(s)) {
    const i = enquiries.length;
    const source = SOURCES[i];
    const pkg = source === 'package-widget' || source === 'mobile-bar' ? pickPackage() : null;
    if (source === 'plan-my-event') visit(s, '/plan-my-event');
    const name = NAMES[i];
    const enquiry = {
      id: `EQSEED${String(i + 1).padStart(2, '0')}`, createdAt: null, source, package: pkg, name,
      phone: `9${int(100000000, 899999999)}`, category: pkg?.category ?? pick(['weddings', 'birthdays', 'corporate', 'destination-weddings']),
      destination: pkg?.destination ?? pick(['goa', 'jaipur', 'mumbai', undefined]), guests: int(20, 300), budget: pick(BUDGETS),
      date: new Date(now + int(30, 180) * DAY).toISOString().slice(0, 10), session: s,
    };
    enquire(s, enquiry);
    enquiry.createdAt = new Date(s.t).toISOString();
    enquiries.push(enquiry);
  }

  if (s === bookingSession || abandonSessions.includes(s)) {
    const pkg = s === bookingSession ? PACKAGES[0] : pickPackage();
    if (s.path !== `/packages/${pkg.slug}`) browsePackage(s, pkg, 0.9);
    const draft = { package_slug: pkg.slug, tier: 'classic', event_date: new Date(now + 75 * DAY).toISOString().slice(0, 10), quantity: s === bookingSession ? 40 : int(20, 120) };
    emit(s, 'ticket_option_selected', { package_slug: pkg.slug, tier: 'classic' });
    emit(s, 'date_selected', { package_slug: pkg.slug, event_date: draft.event_date });
    emit(s, 'checkout_started', { ...draft, value: Math.round(pkg.price * 1.18), currency: 'INR' });
    emit(s, 'add_to_cart', { ...draft, category: pkg.category, destination: pkg.destination, price: pkg.price, currency: 'INR' });
    visit(s, '/checkout/booking');
    emit(s, 'booking_form_viewed', { package_slug: pkg.slug, current_step: 'booking_details' });
    emit(s, 'booking_form_started', { package_slug: pkg.slug, first_field: 'contact.name' });
    ['contact.name', 'contact.phone', 'contact.email'].forEach((f, i) => emit(s, 'booking_form_field_filled', { package_slug: pkg.slug, field_name: f, step: 'contact', fields_completed: i + 1 }));
    emit(s, 'booking_form_submit_attempted', { package_slug: pkg.slug, fields_completed: 3 });
    if (s !== bookingSession) {
      emit(s, 'booking_form_validation_failed', { package_slug: pkg.slug, fields: pick([['terms'], ['contact.phone'], ['contact.phone', 'terms'], ['contact.email']]) });
      emit(s, 'cart_abandoned', { package_slug: pkg.slug, current_step: 'booking_details', has_contact: false });
    } else {
      emit(s, 'booking_form_submitted', { package_slug: pkg.slug, event_date: draft.event_date, quantity: 40, whatsapp_opt_in: true });
      visit(s, '/checkout/payment');
      emit(s, 'safe_checkout_viewed', { package_slug: pkg.slug });
      emit(s, 'secure_payment_badge_viewed', { current_step: 'payment' });
      emit(s, 'payment_method_selected', { package_slug: pkg.slug, payment_mode: 'advance', payment_method: 'upi' });
      emit(s, 'payment_initiated', { package_slug: pkg.slug, amount: 68440, value: 342200, currency: 'INR', payment_mode: 'advance', payment_method: 'upi' });
      const conv = { booking_id: 'CSSEED01', package_slug: pkg.slug, category: pkg.category, destination: pkg.destination, value: 342200, amount_paid: 68440, currency: 'INR', emitted_by: 'server' };
      emit(s, 'order_created', conv);
      emit(s, 'booking_confirmed', conv);
      emit(s, 'payment_success', { package_slug: pkg.slug, booking_id: 'CSSEED01', amount: 68440 });
      emit(s, 'booking_success', { package_slug: pkg.slug, booking_id: 'CSSEED01', value: 342200 });
      visit(s, '/checkout/confirmation/CSSEED01');
      emit(s, 'order_confirmation_viewed', { booking_id: 'CSSEED01', value: 342200, currency: 'INR' });
      s.booking = { pkg, at: new Date(s.t).toISOString(), date: draft.event_date };
    }
  }

  if (chance(0.03)) emit(s, 'js_error', { error_message: "Cannot read properties of undefined (reading 'scrollTo')" });
  emit(s, 'exit_page', { time_on_page_ms: int(8000, 240000), scroll_depth_pct: int(20, 100) });
}

// ---------- write ----------
await clear();

const INSERT_BATCH = 300;
for (let i = 0; i < events.length; i += INSERT_BATCH) {
  const rows = events.slice(i, i + INSERT_BATCH);
  await sql`
    INSERT INTO analytics_events (
      id, event_name, occurred_at, anonymous_id, session_id, user_id, is_logged_in, customer_segment,
      page_url, page_path, page_type, referrer, landing_page, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
      source_channel, device_type, browser, os, language, country, state, city, pincode, package_slug, category, destination, properties)
    SELECT id, event_name, occurred_at, anonymous_id, session_id, user_id, is_logged_in, customer_segment,
      page_url, page_path, page_type, referrer, landing_page, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
      source_channel, device_type, browser, os, language, country, state, city, pincode, package_slug, category, destination, properties
    FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS x(
      id uuid, event_name text, occurred_at timestamptz, anonymous_id text, session_id text, user_id text, is_logged_in boolean,
      customer_segment text, page_url text, page_path text, page_type text, referrer text, landing_page text, utm_source text,
      utm_medium text, utm_campaign text, utm_term text, utm_content text, source_channel text, device_type text, browser text,
      os text, language text, country text, state text, city text, pincode text, package_slug text, category text, destination text,
      properties jsonb)`;
}

for (const e of enquiries) {
  const record = {
    id: e.id, createdAt: e.createdAt, status: 'new', name: e.name, phone: e.phone, email: `${e.name.split(' ')[0].toLowerCase()}@example.com`,
    category: e.category, destination: e.destination, date: e.date, guests: e.guests, budget: e.budget,
    message: 'Demo enquiry', packageSlug: e.package?.slug, source: e.source,
  };
  await sql`
    INSERT INTO enquiries (id, created_at, status, source, package_slug, category, destination, phone, anonymous_id, session_id, data)
    VALUES (${e.id}, ${e.createdAt}, 'new', ${e.source}, ${e.package?.slug ?? null}, ${e.category ?? null}, ${e.destination ?? null},
            ${e.phone}, ${e.session.visitor.id}, ${e.session.id}, ${JSON.stringify(record)})`;
}

const bs = bookingSession;
const pkg = bs.booking.pkg;
const tier = { key: 'classic', name: 'Classic', multiplier: 1, price: 290000, description: 'Everything you need for a beautiful celebration.', perks: [] };
const quote = { tier, guests: 40, extraGuests: 0, extraGuestsCost: 0, addons: [], addonsTotal: 0, discount: 0, subtotal: 290000, gst: 52200, total: 342200, advance: 68440, fullPayment: 331934 };
const booking = {
  id: 'CSSEED01', createdAt: bs.booking.at, packageSlug: pkg.slug, tier: 'classic', date: bs.booking.date, guests: 40, addons: [], coupon: null,
  contact: { name: 'Ritika Agarwal', phone: '9876501234', email: 'ritika@example.com', city: bs.visitor.city[0], whatsapp: true, gstInvoice: false },
  event: { time: 'Evening (4–8)', hosts: 'Ritika & Varun', food: 'Veg & Non-veg', notes: 'Demo booking' },
  paymentMode: 'advance', paymentMethod: 'upi', packageTitle: pkg.title,
  packageImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=400&q=70', destinationName: 'Goa', quote, amountPaid: 68440, balance: 273760, balanceDueDate: null, status: 'confirmed',
};
await sql`
  INSERT INTO bookings (id, created_at, status, package_slug, event_date, guests, amount_paid, total, phone, email, anonymous_id, session_id, data)
  VALUES ('CSSEED01', ${booking.createdAt}, 'confirmed', ${pkg.slug}, ${booking.date}, 40, 68440, 342200, ${booking.contact.phone},
          ${booking.contact.email}, ${bs.visitor.id}, ${bs.id}, ${JSON.stringify(booking)})`;

const visitorsWithSessions = new Set(sessions.map(s => s.visitor.id)).size;
console.log(`Seeded ${visitorsWithSessions} visitors, ${sessions.length} sessions, ${events.length} events, 1 booking, ${enquiries.length} enquiries.`);
console.log('Remove them any time with: npm run db:seed-demo -- --clear');
