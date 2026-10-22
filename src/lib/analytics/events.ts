/**
 * The tracking plan. Every event the site can emit is listed here; the API rejects anything else.
 *
 * Naming: our "events" (weddings, parties…) are called packages in the code, so the plan's
 * event_id / listing_id map to `package_slug`, and "ticket type" maps to the package tier.
 */
export const EVENT_NAMES = [
  // A. Page & entry
  'page_view', 'home_page_view', 'listing_page_view', 'event_detail_page_view',
  'seo_landing_page_view', 'marketing_landing_page_view', 'session_start', 'session_end', 'exit_page',

  // B. Discovery & listing
  'search_performed', 'filter_applied', 'sort_applied', 'listing_result_viewed', 'listing_result_clicked',
  'pagination_used', 'listing_category_clicked', 'location_clicked', 'date_range_selected',
  'search_result_zero_results', 'compare_events_clicked', 'compare_events_added', 'compare_events_removed',

  // C. Event detail / intent
  'event_viewed', 'event_image_viewed', 'event_gallery_opened', 'event_description_expanded',
  'event_highlights_viewed', 'event_schedule_viewed', 'event_location_viewed', 'venue_map_opened',
  'venue_details_viewed', 'event_review_viewed', 'review_count_viewed', 'organizer_profile_viewed',
  'faq_viewed', 'policy_viewed', 'cancellation_policy_viewed', 'refund_policy_viewed',
  'event_share_clicked', 'share_link_copied', 'wishlist_added', 'wishlist_removed',
  'shortlist_added', 'shortlist_removed',
  'event_opened_from_email', 'event_opened_from_ads', 'event_opened_from_google_search',

  // D. Booking funnel
  'ticket_type_viewed', 'ticket_option_selected', 'ticket_quantity_updated', 'date_selected',
  'time_slot_selected', 'package_selected', 'add_on_selected', 'add_on_removed', 'add_to_cart',
  'cart_updated', 'cart_removed', 'cart_abandoned', 'checkout_started',
  'booking_form_viewed', 'booking_form_started', 'booking_form_field_filled',
  'booking_form_validation_failed', 'booking_form_submit_attempted', 'booking_form_submitted',
  'booking_success', 'booking_failed', 'coupon_applied', 'coupon_failed',
  'payment_method_selected', 'payment_initiated', 'payment_success', 'payment_failed', 'payment_cancelled',
  'order_confirmation_viewed', 'booking_receipt_downloaded',

  // E. Enquiry funnel
  'enquiry_form_viewed', 'enquiry_form_started', 'enquiry_field_filled', 'enquiry_submit_attempted',
  'enquiry_submitted', 'enquiry_success', 'enquiry_failed', 'callback_requested',
  'whatsapp_click', 'call_click', 'email_click', 'brochure_downloaded', 'brochure_requested',
  'contact_vendor_clicked',

  // F. Trust & decision support
  'price_breakdown_viewed', 'delivery_or_shipping_info_viewed', 'event_included_items_viewed',
  'testimonial_viewed', 'rating_viewed', 'user_review_opened', 'customer_support_chat_opened',
  'customer_support_chat_initiated', 'faq_search_performed', 'refund_information_viewed',
  'safe_checkout_viewed', 'secure_payment_badge_viewed', 'terms_and_conditions_viewed',

  // G. Conversion & post-conversion (mostly emitted server-side)
  'lead_created', 'order_created', 'booking_confirmed', 'enquiry_confirmed',
  'reminder_email_sent', 'followup_email_sent', 'customer_support_followup_initiated',
  'reengagement_campaign_clicked',

  // H. Technical / quality
  'page_load_time', 'api_error', 'checkout_error', 'form_error', 'js_error', 'slow_page_detected',
  'failed_payment_gateway', 'network_issue_detected', 'session_timeout', 'session_recovered',
  'login_success', 'logout',
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export const isEventName = (v: string): v is EventName => (EVENT_NAMES as readonly string[]).includes(v);

/** Free-form, JSON-serialisable event fields. Never put names, phone numbers or emails in here. */
export type EventProps = Record<string, string | number | boolean | null | undefined | string[]>;

export type PageType =
  | 'home' | 'listing' | 'category' | 'destination' | 'event_detail' | 'checkout_booking' | 'checkout_payment'
  | 'confirmation' | 'plan_my_event' | 'account' | 'wishlist' | 'blog' | 'content' | 'other';

export function pageTypeFor(path: string): PageType {
  if (path === '/') return 'home';
  if (path === '/packages') return 'listing';
  if (path.startsWith('/packages/')) return 'event_detail';
  if (path.startsWith('/events')) return 'category';
  if (path.startsWith('/destinations')) return 'destination';
  if (path === '/checkout/booking') return 'checkout_booking';
  if (path === '/checkout/payment') return 'checkout_payment';
  if (path.startsWith('/checkout/confirmation')) return 'confirmation';
  if (path === '/plan-my-event') return 'plan_my_event';
  if (path === '/account') return 'account';
  if (path === '/wishlist') return 'wishlist';
  if (path.startsWith('/blog')) return 'blog';
  if (['/about', '/contact', '/faq'].includes(path)) return 'content';
  return 'other';
}

/** What a URL says about the package / category / destination being browsed. */
export function pathContext(path: string): EventProps {
  const [, section, slug] = path.split('/');
  if (!slug) return {};
  if (section === 'packages') return { package_slug: slug };
  if (section === 'events') return { category: slug };
  if (section === 'destinations') return { destination: slug };
  return {};
}

/** Category and destination pages are listings too. */
export const isListingPage = (t: PageType) => t === 'listing' || t === 'category' || t === 'destination';
