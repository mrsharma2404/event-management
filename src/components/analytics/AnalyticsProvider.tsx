'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { claimLanding, currentSession, flush, identify, resetPageScope, setLastUrl, track, trackOnce } from '@/lib/analytics/client';
import { isListingPage, pageTypeFor, pathContext, type EventName, type EventProps } from '@/lib/analytics/events';
import { useAppSelector, useAppStore } from '@/store/hooks';
import { hashId } from '@/store/analyticsListener';

const SLOW_PAGE_MS = 4000;

const scrollPct = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  return max > 0 ? Math.min(100, Math.round((scrollY / max) * 100)) : 100;
};

/** `data-track-package-slug="x"` → { package_slug: 'x' }; numeric strings become numbers. */
function dataProps(el: HTMLElement): EventProps {
  const out: EventProps = {};
  for (const [k, v] of Object.entries(el.dataset)) {
    if (!k.startsWith('track') || k === 'track' || k === 'trackLocation' || v === undefined) continue;
    const key = k.slice(5).replace(/^[A-Z]/, c => c.toLowerCase()).replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
    out[key] = /^\d+(\.\d+)?$/.test(v) ? Number(v) : v;
  }
  return out;
}

/** Where on the page a CTA sits: an explicit data-track-location, else header/footer/nearest section id. */
function ctaLocation(el: HTMLElement) {
  return el.closest<HTMLElement>('[data-track-location]')?.dataset.trackLocation
    ?? (el.closest('header') ? 'header' : el.closest('footer') ? 'footer' : el.closest('[data-mobile-bar]') ? 'mobile_bar' : el.closest('section[id]')?.id);
}

/**
 * Site-wide automatic tracking: page views + landing attribution, exit / abandonment, performance,
 * JS errors, connectivity, and clicks on contact links or any element with `data-track="event_name"`.
 */
export function AnalyticsProvider() {
  const pathname = usePathname();
  const store = useAppStore();
  const user = useAppSelector(s => s.account.user);
  const hasBookings = useAppSelector(s => s.account.bookingIds.length > 0);
  const hasEnquiries = useAppSelector(s => s.account.enquiryIds.length > 0);
  const page = useRef({ path: '', start: 0, maxScroll: 0 });
  const prevPage = useRef(page.current);

  // Who the visitor is: logged-in state and a coarse lifecycle segment.
  useEffect(() => {
    const segment = hasBookings ? 'customer' : hasEnquiries ? 'lead' : currentSession().number > 1 ? 'returning' : 'new';
    identify({ isLoggedIn: !!user, customerSegment: segment });
    if (user) hashId(user.phone).then(userId => identify({ userId }));
  }, [user, hasBookings, hasEnquiries]);

  // Page views. Keyed on pathname only: listing filters rewrite the query string and are tracked as filter events.
  useEffect(() => {
    // Guarded so StrictMode's double effect run doesn't record the page as its own predecessor.
    if (page.current.path !== pathname) {
      prevPage.current = page.current;
      page.current = { path: pathname, start: performance.now(), maxScroll: 0 };
    }
    const prev = prevPage.current;
    const t = setTimeout(() => {
      const session = currentSession();
      const pageType = pageTypeFor(pathname);
      const ctx = pathContext(pathname);
      resetPageScope();

      track('page_view', {
        page_name: document.title,
        page_type: pageType,
        ...ctx,
        prev_page_path: prev.path || undefined,
        prev_page_time_ms: prev.path ? Math.round(performance.now() - prev.start) : undefined,
        prev_page_scroll_pct: prev.path ? prev.maxScroll : undefined,
      });
      if (pageType === 'home') track('home_page_view');
      else if (isListingPage(pageType)) track('listing_page_view', { listing_type: pageType, ...ctx });
      else if (pageType === 'event_detail') track('event_detail_page_view', ctx);

      // First page of the session: attribute the landing.
      if (claimLanding()) {
        const landing = { landing_page: session.landingPage, page_type: pageType, ...ctx };
        const ch = session.source_channel;
        if (ch === 'organic_search') track('seo_landing_page_view', landing);
        if (ch === 'paid' || ch === 'email' || ch === 'campaign') track('marketing_landing_page_view', landing);
        if (session.utm_campaign && /re-?engag/i.test(session.utm_campaign)) track('reengagement_campaign_clicked', landing);
        if (pageType === 'event_detail') {
          if (ch === 'email') track('event_opened_from_email', ctx);
          if (ch === 'paid') track('event_opened_from_ads', ctx);
          if (ch === 'organic_search' && session.referrer?.includes('google.')) track('event_opened_from_google_search', ctx);
        }
      }
      setLastUrl(location.href);
    }, 0); // let Next.js commit the new <title> first
    return () => clearTimeout(t);
  }, [pathname]);

  // Everything that only needs to be wired once.
  useEffect(() => {
    const onScroll = () => { page.current.maxScroll = Math.max(page.current.maxScroll, scrollPct()); };

    const onHide = () => {
      const pageType = pageTypeFor(location.pathname);
      track('exit_page', {
        page_type: pageType,
        time_on_page_ms: Math.round(performance.now() - page.current.start),
        scroll_depth_pct: page.current.maxScroll,
      });
      const draft = store.getState().bookingDraft;
      if (draft.packageSlug && (pageType === 'checkout_booking' || pageType === 'checkout_payment')) {
        track('cart_abandoned', {
          package_slug: draft.packageSlug, tier: draft.tier, quantity: draft.guests, event_date: draft.date,
          current_step: pageType === 'checkout_booking' ? 'booking_details' : 'payment', has_contact: !!draft.contact,
        });
      }
      flush(true);
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(true); };

    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      // FAQ accordions (<details>): the click lands before the toggle, so a closed one is being opened.
      const summary = target?.closest('summary');
      if (summary && !(summary.parentElement as HTMLDetailsElement).open) {
        track('faq_viewed', { question: summary.textContent?.replace(/\+$/, '').trim().slice(0, 150) });
      }
      // The innermost interactive element wins, e.g. a wishlist button inside a tracked card link.
      const el = target?.closest<HTMLElement>('[data-track], a[href], button');
      if (!el || (el.tagName === 'BUTTON' && !el.dataset.track)) return;
      const ctx = { cta_location: ctaLocation(el) };
      if (el.dataset.track) return track(el.dataset.track as EventName, { ...ctx, ...dataProps(el) });
      const href = el.getAttribute('href') ?? '';
      const label = el.innerText?.replace(/\s+/g, ' ').trim().slice(0, 80) || el.getAttribute('aria-label') || undefined;
      if (href.startsWith('tel:')) track('call_click', { ...ctx, link_text: label });
      else if (/wa\.me|whatsapp\.com/.test(href)) track('whatsapp_click', { ...ctx, link_text: label });
      else if (href.startsWith('mailto:')) track('email_click', { ...ctx, link_text: label });
      else {
        const [, section, slug] = href.match(/^\/(events|destinations)\/([\w-]+)/) ?? [];
        if (section === 'events') track('listing_category_clicked', { ...ctx, category: slug, link_text: label });
        if (section === 'destinations') track('location_clicked', { ...ctx, destination: slug, link_text: label });
      }
    };

    const onError = (e: ErrorEvent) => {
      const message = String(e.message || 'Unknown error').slice(0, 300);
      trackOnce(`js:${message}`, 'js_error', { error_message: message, source: e.filename?.slice(0, 200), line: e.lineno, column: e.colno });
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const message = String((e.reason as Error)?.message ?? e.reason).slice(0, 300);
      trackOnce(`js:${message}`, 'js_error', { error_message: message, kind: 'unhandled_rejection' });
    };
    const onOffline = () => track('network_issue_detected', { kind: 'offline' });
    const onOnline = () => flush();

    const reportLoad = () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (!nav) return;
      const timings = {
        page_type: pageTypeFor(location.pathname),
        load_ms: Math.round(nav.loadEventEnd || nav.domComplete),
        ttfb_ms: Math.round(nav.responseStart),
        dom_content_loaded_ms: Math.round(nav.domContentLoadedEventEnd),
        transfer_kb: Math.round(nav.transferSize / 1024),
        connection: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType,
      };
      track('page_load_time', timings);
      if (timings.load_ms > SLOW_PAGE_MS) track('slow_page_detected', { ...timings, threshold_ms: SLOW_PAGE_MS });
    };
    // loadEventEnd is only populated after the load handler has finished.
    const onLoad = () => setTimeout(reportLoad, 0);
    if (document.readyState === 'complete') onLoad();
    else addEventListener('load', onLoad, { once: true });

    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('click', onClick, { capture: true });
    addEventListener('error', onError);
    addEventListener('unhandledrejection', onRejection);
    addEventListener('offline', onOffline);
    addEventListener('online', onOnline);
    return () => {
      removeEventListener('load', onLoad);
      removeEventListener('scroll', onScroll);
      removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('click', onClick, { capture: true });
      removeEventListener('error', onError);
      removeEventListener('unhandledrejection', onRejection);
      removeEventListener('offline', onOffline);
      removeEventListener('online', onOnline);
    };
  }, [store]);

  return null;
}
