export type CategorySlug =
  | 'weddings'
  | 'destination-weddings'
  | 'pre-wedding'
  | 'birthdays'
  | 'corporate'
  | 'concerts'
  | 'private-parties';

export interface Category {
  slug: CategorySlug;
  name: string;
  singular: string;
  icon: string;
  image: string;
  tagline: string;
  about: string;
}

export interface Destination {
  slug: string;
  name: string;
  region: string;
  country: string;
  image: string;
  about: string;
  bestTime: string;
  venues: number;
  international?: boolean;
}

export type TierKey = 'classic' | 'premium' | 'luxe';

export interface Tier {
  key: TierKey;
  name: string;
  multiplier: number;
  price: number;
  description: string;
  perks: string[];
}

export interface TimelineItem {
  when: string;
  title: string;
  description: string;
}

export interface Review {
  name: string;
  city: string;
  rating: number;
  date: string;
  text: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface EventPackage {
  slug: string;
  title: string;
  category: CategorySlug;
  destination: string;
  price: number;
  mrp: number;
  rating: number;
  reviewCount: number;
  duration: string;
  guests: { min: number; max: number; included: number };
  perGuest: number;
  images: string[];
  tag?: string;
  /** High-ticket packages lead with "Get a quote" instead of "Book now". */
  enquiryFirst?: boolean;
  highlights: string[];
  overview: string;
  tiers: Tier[];
  inclusions: string[];
  exclusions: string[];
  timeline: TimelineItem[];
  policies: string[];
  faqs: Faq[];
  reviews: Review[];
}

export interface Addon {
  key: string;
  name: string;
  description: string;
  price: number;
}

export interface Coupon {
  code: string;
  percent: number;
  maxDiscount: number;
  label: string;
}

export interface Testimonial {
  name: string;
  text: string;
  context: string;
  image: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  author: string;
  date: string;
  readMinutes: number;
  body: string[];
}

export interface Quote {
  tier: Tier;
  guests: number;
  extraGuests: number;
  extraGuestsCost: number;
  addons: Addon[];
  addonsTotal: number;
  discount: number;
  subtotal: number;
  gst: number;
  total: number;
  advance: number;
  fullPayment: number;
}

export interface PackageFilters {
  categories: CategorySlug[];
  destinations: string[];
  budget: string;
  guests: string;
  minRating: number;
  instantOnly: boolean;
  sort: SortKey;
  q: string;
}

export type SortKey = 'popular' | 'rating' | 'price-asc' | 'price-desc' | 'discount';

export interface ContactDetails {
  name: string;
  phone: string;
  email: string;
  city?: string;
  whatsapp: boolean;
  gstInvoice: boolean;
  company?: string;
  gstin?: string;
}

export interface EventDetails {
  time: string;
  hosts?: string;
  food: string;
  notes?: string;
}

export type PaymentMode = 'advance' | 'full';
export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'emi';

export interface Enquiry {
  name: string;
  phone: string;
  email?: string;
  category?: string;
  destination?: string;
  date?: string;
  guests?: number;
  budget?: string;
  message?: string;
  packageSlug?: string;
  source: string;
}

export interface EnquiryRecord extends Enquiry {
  id: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'quoted';
}

export interface BookingRequest {
  packageSlug: string;
  tier: TierKey;
  date: string;
  guests: number;
  addons: string[];
  coupon?: string | null;
  contact: ContactDetails;
  event: EventDetails;
  paymentMode: PaymentMode;
  paymentMethod: PaymentMethod;
}

export interface BookingRecord extends BookingRequest {
  id: string;
  packageTitle: string;
  packageImage: string;
  destinationName: string;
  quote: Quote;
  amountPaid: number;
  balance: number;
  balanceDueDate: string | null;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}
