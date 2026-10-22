# Crown & Co. Events

An event-booking marketplace for weddings, parties, corporate events and concerts. It is built with **Next.js 15 (App Router)**, **TypeScript**, **Redux Toolkit + RTK Query**, **Tailwind CSS**, **react-hook-form + zod**, and **Neon Postgres** for bookings, enquiries and first-party analytics.

The business model has two ways to convert a visitor, like Thrillophilia and The Wedding Company:

1. **Direct booking:** Package → Book Now → Booking details → Payment (20% advance or full) → Confirmation
2. **Lead / enquiry:** a "Get a custom quote" modal, inline forms, the *Plan My Event* wizard, and listing banners. High-ticket packages (`enquiryFirst`) show the quote button first.

## Getting started

```bash
npm install
cp .env.example .env.local   # then paste your Neon DATABASE_URL
npm run db:migrate           # creates tables (idempotent)
npm run dev        # http://localhost:3000
npm run build && npm start
npm run typecheck
npm run lint
```

Optional: set `NEXT_PUBLIC_SITE_URL` for absolute URLs in the sitemap, robots.txt and Open Graph tags, and `NEXT_PUBLIC_ANALYTICS_DEBUG=1` to log every tracked event in the browser console.

**Demo data:** test card `4111 1111 1111 1111` (any future expiry), coupons `STAR10` / `FIRSTCELEB`, and login OTP `123456`.

## Pages

| Route | Description |
|---|---|
| `/` | Home: hero search, occasions, trending packages, destinations, two-path CTA, how it works, testimonials, blog |
| `/events`, `/events/[category]` | All occasions; category page with destination chips, sticky enquiry form and FAQs |
| `/destinations`, `/destinations/[slug]` | All destinations; destination page with occasion chips, best time to visit, and an enquiry form |
| `/packages` | Listing with filters (occasion, destination, budget, guests, rating, instant booking), search and sort, synced to the URL |
| `/packages/[slug]` | Package details: gallery and lightbox, scroll-spy tabs, tier selector, inclusions, itinerary, reviews, FAQs, booking widget, mobile booking bar, JSON-LD |
| `/checkout/booking` | Contact and event details, add-ons, GST invoice, coupon, live order summary |
| `/checkout/payment` | 20% advance or pay in full (3% off); UPI, card (Luhn check), net banking, EMI calculator |
| `/checkout/confirmation/[id]` | Booking receipt (printable) |
| `/plan-my-event` | 5-step lead-capture wizard |
| `/account` | My bookings and enquiries |
| `/wishlist` | Saved packages |
| `/blog`, `/blog/[slug]` | Ideas and guides |
| `/about`, `/contact`, `/faq` | Company pages (contact also handles `?topic=vendor` sign-ups) |

## Architecture

```
src/
├── app/                      # Routes (server components by default)
│   ├── api/                  # Route handlers = backend
│   │   ├── packages/         #   GET search, GET by slug
│   │   ├── bookings/         #   POST create (server re-prices), GET list / by id
│   │   ├── enquiries/        #   POST create, GET list
│   │   ├── coupons/validate/ #   POST
│   │   ├── events/           #   POST batched analytics events → Neon
│   │   └── auth/{otp,verify} #   Mock phone-OTP login
│   ├── sitemap.ts, robots.ts, not-found.tsx, error.tsx, loading.tsx
├── components/
│   ├── analytics/            # AnalyticsProvider (automatic tracking), TrackSectionViews
│   ├── ui/                   # Design-system primitives: Button, Field, Modal, Toaster, SmartImage…
│   ├── layout/               # Header (mega menus, mobile nav, account menu), Footer, CTA band
│   ├── home/                 # Home page sections
│   ├── packages/             # PackageCard, FilterSidebar, PackagesExplorer, WishlistButton
│   ├── package-detail/       # Gallery, StickyTabs, TierSelector, BookingWidget, SelectionContext…
│   ├── collection/           # Shared category/destination page parts
│   ├── checkout/             # Stepper, guard, booking form, add-ons, coupon, summary, payment
│   ├── enquiry/              # EnquiryForm, EnquiryModal, AuthModal, PlanWizard
│   └── account/              # Account dashboard, wishlist
├── store/                    # Redux Toolkit
│   ├── store.ts              #   makeStore() per request (App Router pattern)
│   ├── StoreProvider.tsx     #   Client provider + localStorage rehydration
│   ├── api.ts                #   RTK Query endpoints for /api/*
│   ├── persistence.ts        #   Listener middleware → debounced localStorage writes
│   ├── analyticsListener.ts  #   Listener middleware → analytics events from Redux actions
│   ├── selectors.ts          #   Memoised selectors (e.g. live checkout quote)
│   └── slices/               #   bookingDraft, wishlist, account, ui
├── lib/
│   ├── data/                 # Catalogue: categories, destinations, packages, add-ons, content
│   ├── catalog.ts            # Search/filter/sort + URL ⇄ filter mapping (shared by server & client)
│   ├── pricing.ts            # Single pricing function used by UI *and* the bookings API
│   ├── validation.ts         # zod schemas shared by forms and route handlers
│   ├── analytics/            # Tracking plan (events.ts) + browser tracker (client.ts)
│   └── server/               # Neon client, repositories, analytics ingestion (server-only)
├── hooks/                    # usePackageFilters, useHydrated, useTrackView, useFormTracking
└── types/
db/schema.sql                 # Postgres schema (bookings, enquiries, otps, analytics_events)
scripts/migrate.mjs           # Applies db/schema.sql (npm run db:migrate)
```

### Key decisions

- **Server components first.** Catalogue pages are statically generated (`generateStaticParams`, with `dynamicParams = false` so unknown slugs return a real 404). Client components are only the interactive leaves.
- **Redux holds client state; the URL holds listing filters.** Filters live in the query string (shareable, back-button friendly). Results come from RTK Query, cached per query string, with server-rendered results for the first paint.
- **The server is the pricing authority.** `lib/pricing.ts#quote` drives the UI, and `/api/bookings` re-computes totals from the catalogue, so the client can't tamper with prices.
- **Persistence:** the booking draft, wishlist and account are saved to localStorage by listener middleware (debounced, and flushed on `pagehide`). `useHydrated()` keeps the first client render identical to the server HTML, which avoids hydration mismatches when page segments hydrate after the layout.
- **One schema per contract:** zod schemas validate both the forms (via `@hookform/resolvers`) and the API request bodies.

## Going to production

| Demo piece | Replace with |
|---|---|
| `lib/data/*` catalogue | A CMS or database, read through `lib/catalog.ts` |
| Simulated payment in `PaymentPanel` | A Razorpay/Stripe order from `/api/bookings`, confirmed by webhook |
| Mock OTP (`123456`) | An SMS provider (MSG91/Twilio) and a session cookie (NextAuth / iron-session) |
| Enquiry `POST` | Also push to a CRM / WhatsApp Business API (see the `TODO` in the route) |

## Database (Neon)

All persistence goes through `src/lib/server/db.ts` (repositories) and `src/lib/server/neon.ts` (the `@neondatabase/serverless` HTTP driver, which suits Vercel's serverless functions: no connection pool to manage).

| Table | Contents |
|---|---|
| `bookings` | One row per booking; full record in `data` (jsonb), key fields as columns |
| `enquiries` | One row per lead; `status` is its own column so sales can update it |
| `otps` | Demo login codes (5-minute expiry, single use) |
| `analytics_events` | Every tracked event (see below) |

Bookings and enquiries also store the visitor's `anonymous_id` / `session_id`, so each conversion can be joined back to the sessions that led to it.

### Deploying to Vercel

1. Import the repo in Vercel.
2. **Storage → Connect Database → Neon** (Marketplace integration). This sets `DATABASE_URL` for Production, Preview and Development, and can give each preview deployment its own Neon branch.
3. Deploy. The `vercel-build` script runs `npm run db:migrate` before `next build`, so tables are created/updated on every deploy (the schema is idempotent).
4. Locally: `vercel env pull .env.local` (or paste the connection string), then `npm run db:migrate`.

## Analytics

First-party event tracking. Events are stored in your own Neon database, so no third-party script is needed.

```
browser ── track() ──► queue ──(every 2 s / 20 events / sendBeacon on exit)──► POST /api/events ──► analytics_events
route handlers ── trackServer() ─────────────────────────────────────────────────────────────────────┘
```

- **Tracking plan:** `src/lib/analytics/events.ts` lists every allowed event name. `/api/events` rejects anything else, so typos fail loudly in dev.
- **Identity:** `anonymous_id` is stored in localStorage for the long term. `session_id` resets after 30 min of inactivity or when the visitor arrives from a new `utm_campaign`. `user_id` is a SHA-256 hash of the phone number after login.
- **Attached to every event:** the page URL, path and type, referrer, landing page, UTM fields, source channel (`paid`, `email`, `organic_search`, `social`, `referral`, `direct`), language, screen size, login state and customer segment (`new`, `returning`, `lead`, `customer`). The server adds the device type, browser and OS from the user agent, plus country, state, city and pincode from Vercel's geo headers. On package, category or destination pages, `package_slug`, `category` and `destination` are filled in automatically.
- **Server-side conversions:** `/api/bookings` emits `order_created` and `booking_confirmed`. `/api/enquiries` emits `lead_created` and `enquiry_confirmed`. These rows are the source of truth for revenue and leads, because client events can be lost to ad blockers or closed tabs.
- **Privacy:** form tracking records field names only, never the values. Names, phone numbers and emails are never sent as event properties.
- **Adding tracking:** call `track('event_name', props)` from client code, or add `data-track="event_name" data-track-foo="bar"` to any element (this works in server components). `useTrackView` and `<TrackSectionViews>` handle "viewed" events.

### What fires where

| Area | Events | Source |
|---|---|---|
| Page & entry | `page_view` (+ previous page's time & scroll depth), `home_page_view`, `listing_page_view`, `event_detail_page_view`, `seo_landing_page_view`, `marketing_landing_page_view`, `session_start`, `session_end`, `session_timeout`, `exit_page` | `AnalyticsProvider` |
| Discovery | `search_performed`, `filter_applied`, `sort_applied`, `listing_result_viewed`, `listing_result_clicked` (with position + list), `search_result_zero_results`, `listing_category_clicked`, `location_clicked` | `PackagesExplorer`, `HeroSearch`, `PackageCard`, chips, any `/events/*` or `/destinations/*` link |
| Event detail | `event_viewed`, `event_gallery_opened`, `event_image_viewed`, `event_highlights_viewed`, `ticket_type_viewed`, `event_included_items_viewed`, `event_schedule_viewed`, `policy_viewed`, `cancellation_policy_viewed`, `refund_policy_viewed`, `event_review_viewed`, `rating_viewed`, `review_count_viewed`, `faq_viewed`, `event_share_clicked`, `share_link_copied`, `wishlist_added/removed`, `event_opened_from_email/ads/google_search` | detail page components |
| Booking funnel | `ticket_option_selected`, `date_selected`, `ticket_quantity_updated`, `checkout_started`, `add_to_cart`, `cart_updated`, `add_on_selected/removed`, `coupon_applied/failed`, `booking_form_viewed/started/field_filled/validation_failed/submit_attempted/submitted`, `time_slot_selected`, `payment_method_selected`, `payment_initiated/success/failed`, `booking_success/failed`, `order_confirmation_viewed`, `booking_receipt_downloaded`, `cart_abandoned` (leaving from checkout) | widget, checkout, Redux listener |
| Enquiry funnel | `enquiry_form_viewed/started`, `enquiry_field_filled`, `enquiry_submit_attempted/submitted/success/failed`, `whatsapp_click`, `call_click`, `email_click` | `EnquiryForm` (modal, sidebar, contact, blog), `PlanWizard`, any `tel:`/`wa.me`/`mailto:` link |
| Trust | `price_breakdown_viewed`, `testimonial_viewed`, `safe_checkout_viewed`, `secure_payment_badge_viewed`, `terms_and_conditions_viewed` | |
| Conversion (server) | `lead_created`, `order_created`, `booking_confirmed`, `enquiry_confirmed` | route handlers |
| Technical | `page_load_time`, `slow_page_detected` (>4 s), `js_error`, `api_error`, `form_error`, `checkout_error`, `failed_payment_gateway`, `network_issue_detected`, `session_recovered` (booking draft restored), `login_success`, `logout` | |

Some names in the plan are registered but **not fired yet, because the site has no matching UI**: `pagination_used`, `date_range_selected`, `compare_events_*`, `event_description_expanded`, `event_location_viewed`, `venue_map_opened`, `venue_details_viewed`, `organizer_profile_viewed`, `shortlist_*`, `cart_removed`, `package_selected` (the tier choice is `ticket_option_selected`), `payment_cancelled`, `callback_requested`, `brochure_*`, `contact_vendor_clicked`, `delivery_or_shipping_info_viewed`, `user_review_opened`, `customer_support_chat_*`, `faq_search_performed`, `refund_information_viewed`. These still need sending, as they depend on a CRM or email system: `reminder_email_sent`, `followup_email_sent`, `customer_support_followup_initiated`. Call `trackServer()` from those systems' webhooks. `re-engagement_campaign_clicked` is stored as `reengagement_campaign_clicked` and fires when `utm_campaign` contains "reengage".

### Useful queries

```sql
-- Booking funnel, last 30 days (unique sessions per step)
SELECT event_name, count(DISTINCT session_id) AS sessions
FROM analytics_events
WHERE occurred_at > now() - interval '30 days'
  AND event_name IN ('event_detail_page_view','ticket_option_selected','date_selected','checkout_started',
                     'booking_form_started','booking_form_submitted','payment_initiated','payment_success')
GROUP BY event_name ORDER BY sessions DESC;

-- Conversion rate by traffic source
SELECT s.source_channel,
       count(DISTINCT s.session_id) AS sessions,
       count(DISTINCT b.session_id) AS booking_sessions,
       count(DISTINCT e.session_id) AS enquiry_sessions
FROM analytics_events s
LEFT JOIN bookings  b ON b.session_id = s.session_id
LEFT JOIN enquiries e ON e.session_id = s.session_id
WHERE s.event_name = 'session_start'
GROUP BY 1 ORDER BY sessions DESC;

-- Drop-off: started the booking form but never paid
SELECT package_slug, count(DISTINCT session_id) AS abandoned_sessions
FROM analytics_events a
WHERE event_name = 'booking_form_started'
  AND NOT EXISTS (SELECT 1 FROM analytics_events p WHERE p.session_id = a.session_id AND p.event_name = 'payment_success')
GROUP BY 1 ORDER BY 2 DESC;

-- Which form fields people fail on
SELECT jsonb_array_elements_text(properties->'fields') AS field, count(*)
FROM analytics_events WHERE event_name = 'booking_form_validation_failed'
GROUP BY 1 ORDER BY 2 DESC;
```

## Admin dashboard

`/dashboard` shows the main numbers for the last 7, 30 or 90 days, read straight from Neon on the server:

- KPIs compared with the previous period
- sessions per day
- booking funnel
- traffic sources
- top packages
- latest bookings and enquiries

It's hidden behind `/admin-login`. The default login is **admin / admin123** (set in `src/lib/server/adminAuth.ts`). To change it without touching code, set env vars:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong password>
ADMIN_SESSION_SECRET=<optional; defaults to the password>
```

Signing in sets a signed, httpOnly cookie that lasts 7 days. Visiting `/dashboard` without it redirects to the login page. Both pages are `noindex` and excluded in `robots.txt`.
