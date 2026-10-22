import type { CategorySlug, EventPackage, Faq, Review, Tier, TimelineItem } from '@/types';
import { PHOTOS as P } from './images';
import { categories } from './categories';
import { destinations } from './destinations';

type Seed = Pick<
  EventPackage,
  'slug' | 'title' | 'category' | 'destination' | 'price' | 'mrp' | 'rating' | 'reviewCount' | 'duration' | 'perGuest' | 'images' | 'highlights' | 'tag' | 'enquiryFirst'
> & { guests: [min: number, max: number, included: number]; inclusions?: string[]; timeline?: TimelineItem[] };

const TIERS: Omit<Tier, 'price'>[] = [
  { key: 'classic', name: 'Classic', multiplier: 1, description: 'Everything you need, beautifully done',
    perks: ['Standard decor theme', 'Set menu', 'Candid photography'] },
  { key: 'premium', name: 'Premium', multiplier: 1.35, description: 'Upgraded decor, menu and photography',
    perks: ['Custom decor theme', 'Live counters', 'Photo + cinematic film', 'Guest welcome kits'] },
  { key: 'luxe', name: 'Luxe', multiplier: 1.8, description: 'Designer decor, celebrity-grade production',
    perks: ['Designer-led decor', 'Gourmet menu & mixologist', 'Same-day edit film', 'Celebrity anchor'] },
];

const buildTiers = (base: number): Tier[] =>
  TIERS.map(t => ({ ...t, price: Math.round((base * t.multiplier) / 500) * 500 }));

const DEFAULT_INCLUSIONS: Record<CategorySlug, string[]> = {
  weddings: ['Venue rental for all functions', 'Decor for every ceremony', 'Catering (veg & non-veg)', 'Wedding planner & on-ground team', 'Photography & videography', 'Sound, lights & DJ'],
  'destination-weddings': ['Venue + accommodation block', 'Decor for every ceremony', 'All meals for guests', 'Hospitality desk & welcome hampers', 'Airport transfers', 'Photography & videography'],
  'pre-wedding': ['Photographer + cinematographer', 'Location permits', 'Local transport during shoot', 'Edited photos & reel', 'Props'],
  birthdays: ['Venue or home setup', 'Theme decor', 'Entertainment', 'Cake', 'Food & beverages', 'Event coordinator'],
  corporate: ['Venue & meeting halls', 'AV, stage & LED', 'Meals & coffee breaks', 'Event manager', 'Branding & signage'],
  concerts: ['Artist fee', 'Sound & lights', 'Stage setup', 'Artist travel within city', 'Show manager'],
  'private-parties': ['Venue', 'Decor', 'Food & beverages', 'Coordinator', 'Music'],
};

const EXCLUSIONS = ['GST (18%) — added at checkout', 'Alcohol unless mentioned', 'Guest travel unless mentioned', 'Anything not listed in inclusions'];

const POLICIES = [
  'Pay 20% advance to block your date; balance due 15 days before the event.',
  'Free date change up to 30 days before the event (subject to venue availability).',
  'Cancellations 60+ days out: 90% refund. 30–60 days: 50%. Under 30 days: non-refundable.',
  'Final guest count must be confirmed 7 days before the event.',
];

const FAQS: Faq[] = [
  { q: 'Can I customise this package?', a: 'Yes. Every package is a starting point — your planner will tailor decor, menu and vendors on the first call. Use “Get a custom quote” to tell us what you need.' },
  { q: 'How much do I pay to confirm?', a: 'Only 20% of the total to block your date. You can also pay in full and save an extra 3%.' },
  { q: 'Are taxes included?', a: 'Prices shown are exclusive of 18% GST, which is added at checkout.' },
  { q: 'Do you handle guest travel and stay?', a: 'Yes, for destination events we manage room blocks, airport transfers and a hospitality desk.' },
  { q: 'What if a vendor doesn’t show up?', a: 'Every booking is covered by Crown & Co. Event Protection — we replace the vendor at our cost or refund that line item.' },
];

const TIMELINES: Record<'multiDay' | 'oneDay' | 'shoot' | 'offsite', TimelineItem[]> = {
  multiDay: [
    { when: 'Day 1', title: 'Welcome & Mehendi', description: 'Guest check-in, welcome lunch, mehendi with live dhol and chaat counters.' },
    { when: 'Day 1 · Evening', title: 'Sangeet Night', description: 'Choreographed performances, DJ and themed dinner.' },
    { when: 'Day 2', title: 'Haldi & Wedding', description: 'Morning haldi, baraat, pheras at the decorated mandap.' },
    { when: 'Day 3', title: 'Reception & Farewell', description: 'Grand reception dinner followed by farewell brunch.' },
  ],
  oneDay: [
    { when: 'T – 3 hrs', title: 'Setup & Styling', description: 'Our crew completes decor, sound and lighting before guests arrive.' },
    { when: 'Start', title: 'Welcome', description: 'Guest welcome, drinks and your entry moment.' },
    { when: 'Main', title: 'Food & Entertainment', description: 'Dinner service, performances and music — your planner runs the show.' },
    { when: 'Close', title: 'Wrap-up', description: 'Guest send-off and teardown — nothing for you to manage.' },
  ],
  shoot: [
    { when: 'Day – 7', title: 'Mood-board Call', description: 'Choose outfits, poses and locations with your photographer.' },
    { when: 'Shoot Day', title: 'Golden-hour Shoot', description: 'Start at sunrise for the best light and fewest crowds.' },
    { when: '+3 days', title: 'Teaser Reel', description: 'A short reel delivered for your socials.' },
    { when: '+14 days', title: 'Final Delivery', description: 'Edited photos and film delivered via online gallery.' },
  ],
  offsite: [
    { when: 'Day 1', title: 'Arrival & Kick-off', description: 'Check-in, welcome lunch, CEO address and ice-breakers.' },
    { when: 'Day 2', title: 'Strategy & Team-building', description: 'Facilitated workshops in the morning, outdoor activities post lunch.' },
    { when: 'Day 2 · Night', title: 'Gala Dinner', description: 'Themed dinner, awards and live music.' },
    { when: 'Day 3', title: 'Wrap & Depart', description: 'Action-plan session, brunch and departures.' },
  ],
};

const REVIEW_POOL: Review[] = [
  { name: 'Ananya & Rohan', city: 'Delhi', rating: 5, date: '2026-02-14', text: 'Our planner handled 300 guests without a single hiccup. The decor was exactly what we pinned on Pinterest.' },
  { name: 'Karan Mehta', city: 'Bengaluru', rating: 5, date: '2026-01-22', text: 'Booked with just the 20% advance and everything else was handled over WhatsApp. Super smooth.' },
  { name: 'Priya S.', city: 'Mumbai', rating: 4, date: '2025-12-09', text: 'Great value for the price. Food could have had more variety but the team was incredibly responsive.' },
  { name: 'Neha & Arjun', city: 'Pune', rating: 5, date: '2026-03-02', text: 'They customised the whole package after a single call. The sunset ceremony was magical.' },
  { name: 'Vikram Rao', city: 'Hyderabad', rating: 5, date: '2025-11-18', text: 'Ran our offsite for 80 people. Logistics were flawless and the team building was the highlight.' },
  { name: 'Sana Qureshi', city: 'Lucknow', rating: 4, date: '2026-04-11', text: 'Lovely experience overall. The coordinator was on call at midnight when we needed a last-minute change.' },
];

const seeds: Seed[] = [
  // ---------- Weddings ----------
  { slug: 'royal-palace-wedding-jaipur', title: 'Royal Palace Wedding at a Jaipur Heritage Haveli', category: 'weddings', destination: 'jaipur',
    price: 850000, mrp: 1000000, rating: 4.9, reviewCount: 212, duration: '3 days', guests: [100, 400, 150], perGuest: 2800,
    images: [P.jaipur, P.aisle, P.floralTable, P.weddingKiss, P.brideBouquet], tag: 'Bestseller', enquiryFirst: true,
    highlights: ['Heritage haveli venue for 3 days', 'Mehendi, sangeet, wedding & reception', 'Rajasthani folk performers & baraat on horseback', 'Dedicated wedding planner + 12-member ops team'] },
  { slug: 'mumbai-ballroom-wedding', title: 'Sea-Facing Ballroom Wedding in Mumbai', category: 'weddings', destination: 'mumbai',
    price: 550000, mrp: 640000, rating: 4.7, reviewCount: 168, duration: '2 days', guests: [150, 600, 200], perGuest: 2200,
    images: [P.mumbaiTaj, P.banquet, P.tableSetting, P.ringsFlowers], tag: 'Popular',
    highlights: ['5-star sea-facing ballroom', 'Floral mandap & stage design', 'Multi-cuisine buffet with live counters', 'Candid photo + cinematic film'] },
  { slug: 'intimate-villa-wedding-goa', title: 'Intimate Villa Wedding in North Goa', category: 'weddings', destination: 'goa',
    price: 290000, mrp: 340000, rating: 4.8, reviewCount: 96, duration: '1 day', guests: [20, 80, 40], perGuest: 3200,
    images: [P.goa, P.mrMrs, P.floralTable, P.goldRings], tag: 'Intimate',
    highlights: ['Private Portuguese villa', 'Sunset ceremony by the pool', 'Plated 4-course dinner', 'Live acoustic band'] },
  { slug: 'kerala-temple-town-wedding', title: 'Traditional Kerala Wedding in Kochi', category: 'weddings', destination: 'kerala',
    price: 380000, mrp: 430000, rating: 4.6, reviewCount: 71, duration: '1 day', guests: [100, 500, 200], perGuest: 1400,
    images: [P.kerala, P.floralTable, P.brideBouquet, P.goldRings],
    highlights: ['Heritage convention hall', 'Banana-leaf Sadya for all guests', 'Nadaswaram & Chenda melam', 'Jasmine & marigold decor'] },
  { slug: 'agra-mughal-garden-wedding', title: 'Mughal Garden Wedding near the Taj', category: 'weddings', destination: 'agra',
    price: 480000, mrp: 560000, rating: 4.7, reviewCount: 54, duration: '2 days', guests: [80, 350, 150], perGuest: 2100,
    images: [P.agra, P.aisle, P.banquet, P.weddingKiss],
    highlights: ['Taj-view lawn venue', 'Mughlai feast with live tandoor', 'Qawwali night', 'Heritage photo walk for the couple'] },

  // ---------- Destination weddings ----------
  { slug: 'jaisalmer-fort-destination-wedding', title: 'Golden Fort Destination Wedding, Jaisalmer', category: 'destination-weddings', destination: 'jaisalmer',
    price: 1450000, mrp: 1700000, rating: 4.9, reviewCount: 74, duration: '3 days', guests: [80, 300, 100], perGuest: 5200,
    images: [P.jaisalmer, P.aisle, P.brideBouquet, P.floralTable], tag: 'Luxe pick', enquiryFirst: true,
    highlights: ['Fort-view venue + luxury desert camp', 'Starlit sangeet in the dunes', 'Guest travel desk & room block', 'Camel-cart baraat'] },
  { slug: 'goa-beach-destination-wedding', title: 'Beachfront Destination Wedding in Goa', category: 'destination-weddings', destination: 'goa',
    price: 980000, mrp: 1150000, rating: 4.8, reviewCount: 189, duration: '3 days', guests: [80, 250, 100], perGuest: 4200,
    images: [P.goa, P.aisle, P.cheers, P.goldRings], tag: 'Bestseller',
    highlights: ['Beach resort buyout options', 'Sunset pheras on the sand', 'Pool party & after-party DJ', 'Airport transfers for all guests'] },
  { slug: 'kerala-backwater-wedding', title: 'Backwater Resort Wedding in Kumarakom', category: 'destination-weddings', destination: 'kerala',
    price: 760000, mrp: 880000, rating: 4.7, reviewCount: 58, duration: '2 days', guests: [50, 200, 80], perGuest: 3800,
    images: [P.kerala, P.floralTable, P.ringsFlowers, P.brideBouquet],
    highlights: ['Lakeside resort ceremony', 'Houseboat welcome cruise', 'Traditional Sadya feast', 'Kathakali & Chenda melam'] },
  { slug: 'phuket-island-wedding', title: 'Island Wedding in Phuket, Thailand', category: 'destination-weddings', destination: 'phuket',
    price: 1850000, mrp: 2100000, rating: 4.8, reviewCount: 41, duration: '4 days', guests: [50, 150, 60], perGuest: 9500,
    images: [P.phuket, P.aisle, P.cheers, P.mrMrs], tag: 'International', enquiryFirst: true,
    highlights: ['Cliffside resort venue', 'Indian chefs flown in', 'Visa & flight assistance', 'Yacht welcome party'] },
  { slug: 'himachal-mountain-wedding', title: 'Snow-View Mountain Wedding in Manali', category: 'destination-weddings', destination: 'himachal',
    price: 890000, mrp: 1020000, rating: 4.7, reviewCount: 33, duration: '3 days', guests: [40, 150, 60], perGuest: 4600,
    images: [P.himachal, P.coupleHills, P.floralTable, P.cheers],
    highlights: ['Boutique mountain resort buyout', 'Bonfire sangeet', 'Apple-orchard pheras', 'Volvo transfers from Delhi'] },

  // ---------- Pre-wedding ----------
  { slug: 'taj-mahal-pre-wedding-shoot', title: 'Sunrise Pre-Wedding Shoot at the Taj Mahal', category: 'pre-wedding', destination: 'agra',
    price: 45000, mrp: 55000, rating: 4.9, reviewCount: 342, duration: '1 day', guests: [2, 2, 2], perGuest: 0,
    images: [P.agra, P.coupleHills, P.hillsPortrait, P.goldRings], tag: 'Bestseller',
    highlights: ['Sunrise slot at the Taj', '2 outfit changes + stylist', '60 edited photos + 90-sec reel', 'Permits handled'] },
  { slug: 'himachal-mountain-pre-wedding', title: 'Mountain Pre-Wedding Shoot in Manali', category: 'pre-wedding', destination: 'himachal',
    price: 62000, mrp: 72000, rating: 4.8, reviewCount: 127, duration: '2 days', guests: [2, 2, 2], perGuest: 0,
    images: [P.himachal, P.coupleHills, P.hillsPortrait, P.mrMrs],
    highlights: ['Snow & meadow locations', 'Drone footage', '1 night stay included', '3-min cinematic film'] },
  { slug: 'jaipur-palace-pre-wedding', title: 'Pink City Palace Pre-Wedding Shoot', category: 'pre-wedding', destination: 'jaipur',
    price: 38000, mrp: 45000, rating: 4.7, reviewCount: 211, duration: '1 day', guests: [2, 2, 2], perGuest: 0,
    images: [P.jaipur, P.hillsPortrait, P.coupleHills, P.ringsFlowers],
    highlights: ['Hawa Mahal, Patrika Gate & Nahargarh', 'Vintage car prop', '50 edited photos', 'Makeup artist included'] },
  { slug: 'goa-beach-pre-wedding', title: 'Beach & Old-Goa Pre-Wedding Shoot', category: 'pre-wedding', destination: 'goa',
    price: 42000, mrp: 50000, rating: 4.8, reviewCount: 186, duration: '1 day', guests: [2, 2, 2], perGuest: 0,
    images: [P.goa, P.mrMrs, P.hillsPortrait, P.goldRings],
    highlights: ['Fontainhas lanes + sunset beach', 'Scooter & boat props', '60 edited photos', '60-sec reel'] },
  { slug: 'jaisalmer-desert-pre-wedding', title: 'Desert Dunes Pre-Wedding Shoot', category: 'pre-wedding', destination: 'jaisalmer',
    price: 55000, mrp: 65000, rating: 4.8, reviewCount: 92, duration: '2 days', guests: [2, 2, 2], perGuest: 0,
    images: [P.jaisalmer, P.coupleHills, P.hillsPortrait, P.mrMrs],
    highlights: ['Sam sand dunes at golden hour', 'Fort & haveli locations', 'Camel & jeep props', '1 night desert camp stay'] },

  // ---------- Birthdays ----------
  { slug: 'kids-theme-birthday-mumbai', title: 'Kids’ Theme Birthday Party (Superheroes / Princess)', category: 'birthdays', destination: 'mumbai',
    price: 35000, mrp: 42000, rating: 4.8, reviewCount: 418, duration: '4 hours', guests: [20, 80, 30], perGuest: 650,
    images: [P.balloons, P.confetti, P.cheers, P.floralTable], tag: 'Bestseller',
    highlights: ['Theme decor & balloon arch', 'Magician + game host', 'Character mascot', 'Theme cake & return gifts'] },
  { slug: 'milestone-birthday-goa', title: 'Milestone Birthday Weekend in Goa', category: 'birthdays', destination: 'goa',
    price: 120000, mrp: 145000, rating: 4.7, reviewCount: 86, duration: '2 days', guests: [10, 40, 15], perGuest: 3500,
    images: [P.goa, P.cheers, P.neon, P.confetti],
    highlights: ['Private villa party', 'Sunset cruise', 'Celebrity-style DJ night', 'Custom cake & champagne toast'] },
  { slug: 'first-birthday-jaipur', title: 'First Birthday Celebration in a Jaipur Haveli', category: 'birthdays', destination: 'jaipur',
    price: 68000, mrp: 80000, rating: 4.7, reviewCount: 64, duration: '5 hours', guests: [30, 120, 50], perGuest: 900,
    images: [P.balloons, P.jaipur, P.floralTable, P.confetti],
    highlights: ['Haveli courtyard venue', 'Pastel balloon & floral decor', 'Puppet show & tattoo artist', 'Family photoshoot'] },

  // ---------- Corporate ----------
  { slug: 'corporate-offsite-himachal', title: '3-Day Leadership Offsite in the Himalayas', category: 'corporate', destination: 'himachal',
    price: 420000, mrp: 480000, rating: 4.8, reviewCount: 63, duration: '3 days', guests: [20, 120, 30], perGuest: 9500,
    images: [P.himachal, P.conference, P.dinnerParty, P.audience], tag: 'Teams love it', enquiryFirst: true,
    highlights: ['Mountain resort with meeting halls', 'Facilitated strategy sessions', 'Team-building & bonfire night', 'Travel from Delhi/Chandigarh'] },
  { slug: 'product-launch-mumbai', title: 'Product Launch & Press Event in Mumbai', category: 'corporate', destination: 'mumbai',
    price: 650000, mrp: 720000, rating: 4.6, reviewCount: 37, duration: '1 day', guests: [100, 500, 150], perGuest: 1800,
    images: [P.conference, P.audience, P.microphone, P.neon],
    highlights: ['Venue + stage & LED wall', 'Emcee and media management', 'Live streaming setup', 'Cocktail networking dinner'] },
  { slug: 'annual-day-goa', title: 'Annual Day & Awards Night in Goa', category: 'corporate', destination: 'goa',
    price: 780000, mrp: 900000, rating: 4.7, reviewCount: 52, duration: '2 days', guests: [80, 400, 100], perGuest: 4800,
    images: [P.goa, P.audience, P.concertConfetti, P.cheers],
    highlights: ['Resort + beach gala dinner', 'Awards show production', 'Live band & DJ', 'Group flights & transfers'] },
  { slug: 'kerala-wellness-retreat', title: 'Team Wellness Retreat in Kerala', category: 'corporate', destination: 'kerala',
    price: 360000, mrp: 410000, rating: 4.8, reviewCount: 28, duration: '3 days', guests: [15, 60, 20], perGuest: 14000,
    images: [P.kerala, P.dinnerParty, P.conference, P.tableSetting],
    highlights: ['Ayurvedic resort stay', 'Yoga & mindfulness sessions', 'Houseboat team dinner', 'Offsite facilitator'] },

  // ---------- Concerts ----------
  { slug: 'private-live-band-mumbai', title: 'Private Live Band Night (Bollywood Retro)', category: 'concerts', destination: 'mumbai',
    price: 95000, mrp: 110000, rating: 4.8, reviewCount: 154, duration: '3 hours', guests: [30, 300, 300], perGuest: 0,
    images: [P.concertPhone, P.microphone, P.confettiStage, P.rave], tag: 'Popular',
    highlights: ['6-piece live band', 'Sound & light rig', 'Two 75-min sets', 'Song requests on the night'] },
  { slug: 'college-fest-production-jaipur', title: 'College Fest Stage Production & Headliner', category: 'concerts', destination: 'jaipur',
    price: 850000, mrp: 950000, rating: 4.6, reviewCount: 29, duration: '1 day', guests: [500, 5000, 5000], perGuest: 0,
    images: [P.concertConfetti, P.rave, P.confettiStage, P.concertPhone], enquiryFirst: true,
    highlights: ['Headliner artist booking', 'Truss stage with LED & lasers', 'Crowd barricading & security', 'Artist hospitality'] },
  { slug: 'sunburn-style-beach-party-goa', title: 'EDM Beach Party Production in Goa', category: 'concerts', destination: 'goa',
    price: 320000, mrp: 375000, rating: 4.7, reviewCount: 47, duration: '6 hours', guests: [100, 1000, 1000], perGuest: 0,
    images: [P.rave, P.concertConfetti, P.goa, P.neon],
    highlights: ['2 resident DJs + 1 guest DJ', 'Beach stage & CO2 jets', 'Bar & F&B partners', 'Permits & security'] },
  { slug: 'standup-comedy-night-mumbai', title: 'Private Stand-up Comedy Night', category: 'concerts', destination: 'mumbai',
    price: 75000, mrp: 90000, rating: 4.8, reviewCount: 88, duration: '2 hours', guests: [20, 250, 250], perGuest: 0,
    images: [P.microphone, P.audience, P.neon, P.cheers],
    highlights: ['2 touring comedians', 'Clean or adult set — your call', 'Sound & stage lights', 'Customised roast segment'] },

  // ---------- Private parties ----------
  { slug: 'taj-view-proposal-agra', title: 'Taj-View Rooftop Proposal Dinner', category: 'private-parties', destination: 'agra',
    price: 28000, mrp: 34000, rating: 4.9, reviewCount: 276, duration: '3 hours', guests: [2, 2, 2], perGuest: 0,
    images: [P.agra, P.goldRings, P.tableSetting, P.floralTable], tag: 'Romantic',
    highlights: ['Private rooftop with Taj view', 'Rose & candle decor', 'Violinist for 30 mins', 'Hidden photographer'] },
  { slug: 'anniversary-houseboat-kerala', title: 'Anniversary Night on a Private Houseboat', category: 'private-parties', destination: 'kerala',
    price: 42000, mrp: 50000, rating: 4.8, reviewCount: 133, duration: 'Overnight', guests: [2, 10, 2], perGuest: 3000,
    images: [P.kerala, P.tableSetting, P.cheers, P.floralTable],
    highlights: ['Premium AC houseboat', 'Candlelight dinner on deck', 'Cake & floral decor', 'Morning backwater cruise'] },
  { slug: 'rooftop-cocktail-mumbai', title: 'Rooftop Cocktail Soirée in Bandra', category: 'private-parties', destination: 'mumbai',
    price: 85000, mrp: 99000, rating: 4.7, reviewCount: 91, duration: '5 hours', guests: [20, 100, 30], perGuest: 1900,
    images: [P.neon, P.cheers, P.dinnerParty, P.rave],
    highlights: ['Rooftop lounge buyout', 'Mixologist & bar', 'DJ + fairy-light decor', 'Canapés & live grill'] },
  { slug: 'desert-camp-soiree-jaisalmer', title: 'Starlit Desert Camp Soirée', category: 'private-parties', destination: 'jaisalmer',
    price: 140000, mrp: 165000, rating: 4.8, reviewCount: 39, duration: 'Overnight', guests: [10, 60, 20], perGuest: 4200,
    images: [P.jaisalmer, P.dinnerParty, P.cheers, P.tableSetting],
    highlights: ['Luxury Swiss tents', 'Kalbeliya dancers & bonfire', 'Rajasthani thali under the stars', 'Camel safari at sunset'] },
  { slug: 'phuket-yacht-party', title: 'Private Yacht Party in Phuket', category: 'private-parties', destination: 'phuket',
    price: 210000, mrp: 240000, rating: 4.7, reviewCount: 22, duration: '6 hours', guests: [8, 30, 12], perGuest: 9000,
    images: [P.phuket, P.cheers, P.goa, P.dinnerParty], tag: 'International',
    highlights: ['Catamaran charter', 'Phi Phi island stops', 'Onboard DJ & bar', 'Seafood BBQ lunch'] },
];

function timelineFor(s: Seed): TimelineItem[] {
  if (s.timeline) return s.timeline;
  if (s.category === 'pre-wedding') return TIMELINES.shoot;
  if (s.category === 'corporate' && parseInt(s.duration) > 1) return TIMELINES.offsite;
  if (s.category.includes('wedding') && parseInt(s.duration) > 1) return TIMELINES.multiDay;
  return TIMELINES.oneDay;
}

export const packages: EventPackage[] = seeds.map((s, i) => {
  const category = categories.find(c => c.slug === s.category)!;
  const destination = destinations.find(d => d.slug === s.destination)!;
  const [min, max, included] = s.guests;
  return {
    ...s,
    guests: { min, max, included },
    overview: `${s.title} is one of our most-loved ${category.name} packages in ${destination.name}. Pick a package tier, tell us your date and guest count, and lock it in with a 20% advance — or send us an enquiry and a planner will build a custom quote within 2 hours.`,
    tiers: buildTiers(s.price),
    inclusions: s.inclusions ?? DEFAULT_INCLUSIONS[s.category],
    exclusions: EXCLUSIONS,
    timeline: timelineFor(s),
    policies: POLICIES,
    faqs: FAQS,
    reviews: [0, 1, 3].map(o => REVIEW_POOL[(i + o) % REVIEW_POOL.length]),
  };
});
