import type { BlogPost, Testimonial } from '@/types';
import { PHOTOS as P } from './images';

export const testimonials: Testimonial[] = [
  { name: 'Ishita & Kabir', context: 'Wedding · Jaipur', image: P.weddingKiss,
    text: 'We sent one enquiry and had three venue options with prices in two hours. Booked our Jaipur wedding the same week.' },
  { name: 'Rahul, HR Lead at Finly', context: 'Corporate offsite · Himachal', image: P.conference,
    text: 'Our 120-person offsite was the smoothest event we have ever run. Travel, rooms, sessions — all handled.' },
  { name: 'Sneha Kapoor', context: 'Proposal · Agra', image: P.agra,
    text: 'The Taj proposal dinner was unreal. The hidden photographer caught the exact moment he knelt down!' },
  { name: 'Meera & Dev', context: 'Destination wedding · Goa', image: P.goa,
    text: 'Our guests still talk about the sunset pheras. The hospitality desk made 180 people feel like VIPs.' },
];

export const stats = [
  { value: '12,000+', label: 'Events delivered' },
  { value: '4.8 ★', label: 'Average rating' },
  { value: '60+', label: 'Cities & destinations' },
  { value: '2 hrs', label: 'Quote turnaround' },
];

export const blogPosts: BlogPost[] = [
  {
    slug: 'wedding-budget-breakdown-2026', title: 'The Real Cost of an Indian Wedding in 2026: A Line-by-Line Breakdown',
    excerpt: 'Venue, decor, food, photography — here’s where the money actually goes, and where you can save without anyone noticing.',
    image: P.banquet, category: 'Weddings', author: 'Aditi Rao', date: '2026-09-12', readMinutes: 8,
    body: [
      'Most couples underestimate their wedding budget by 25–30%. Not because they plan badly, but because the small line items — transport, tips, last-minute decor changes — quietly add up.',
      'Across the 3,000+ weddings we planned last year, venue and catering together made up roughly 55% of the total spend. Decor came in at 15–20%, photography and film at 8–10%, and entertainment at 5–7%.',
      'The single biggest lever? Guest count. Every additional guest increases not just catering but also seating, decor density, return gifts and hospitality. Trimming 50 guests typically saves more than downgrading a decor tier.',
      'Our advice: decide your non-negotiables early (for most couples it’s photography and food), lock those vendors first, and let your planner optimise everything else.',
    ],
  },
  {
    slug: 'best-destination-wedding-venues-india', title: '9 Destination Wedding Locations in India That Are Worth the Hype',
    excerpt: 'From Jaisalmer’s golden forts to Kerala’s backwaters — the destinations our couples keep coming back to.',
    image: P.jaisalmer, category: 'Destinations', author: 'Rohan Mehta', date: '2026-08-28', readMinutes: 6,
    body: [
      'A destination wedding doesn’t have to mean flying everyone abroad. India has some of the most spectacular wedding locations in the world — often at half the cost.',
      'Rajasthan remains the crowd favourite: Jaipur for palaces, Udaipur for lakes, Jaisalmer for desert drama. Goa wins for beach ceremonies and after-parties, while Kerala is perfect for intimate, nature-first celebrations.',
      'When choosing, think about guest travel first. A location with a direct flight from where most of your guests live will save you more stress (and money) than any other decision.',
    ],
  },
  {
    slug: 'plan-corporate-offsite-checklist', title: 'The Ultimate Corporate Offsite Checklist (Free Template)',
    excerpt: 'Everything HR and ops teams need to run a smooth offsite — from RFP to the feedback survey.',
    image: P.conference, category: 'Corporate', author: 'Vikram Shah', date: '2026-07-19', readMinutes: 5,
    body: [
      'A great offsite starts with a clear objective. Is it strategy, bonding, celebration or all three? The answer determines venue, agenda and even the food.',
      'Book venues 8–12 weeks out for groups over 50. Shortlist two backups. Confirm AV requirements in writing — this is where most offsites go wrong.',
      'Finally, plan for downtime. The best conversations at offsites happen in the unscheduled hours.',
    ],
  },
  {
    slug: 'kids-birthday-party-themes', title: '12 Kids’ Birthday Party Themes That Never Fail',
    excerpt: 'Superheroes, jungle safari, space explorers and more — with decor and activity ideas for each.',
    image: P.balloons, category: 'Birthdays', author: 'Neha Kapoor', date: '2026-06-30', readMinutes: 4,
    body: [
      'The best kids’ parties have one thing in common: a theme the birthday child genuinely loves. Ask them first!',
      'Superheroes and princesses are evergreen, but we are seeing a big rise in space, dinosaur and science-lab themes — they double up as activities, which keeps kids engaged.',
      'Plan for 60–90 minutes of structured activity; kids under eight lose interest in anything longer.',
    ],
  },
];

export const faqs = [
  { group: 'Booking', items: [
    { q: 'How do I book a package?', a: 'Open any package, choose your tier, date and guest count, then click Book Now. You can reserve your date with just a 20% advance.' },
    { q: 'Can I get a custom quote instead?', a: 'Yes — use “Get a custom quote” on any page or the Plan My Event wizard. A planner will share 3 options within 2 hours.' },
    { q: 'Is my date guaranteed after paying the advance?', a: 'Yes. Your date and venue are blocked the moment the advance is received, and you get a booking confirmation instantly.' },
  ] },
  { group: 'Payments', items: [
    { q: 'Which payment methods do you accept?', a: 'UPI, all major credit and debit cards, net banking from 50+ banks, and no-cost EMI on select cards.' },
    { q: 'When is the balance due?', a: 'The remaining balance is due 15 days before your event. We send reminders 30 and 20 days out.' },
    { q: 'Do you offer GST invoices?', a: 'Yes. Add your company name and GSTIN during booking to receive a GST invoice.' },
  ] },
  { group: 'Cancellations', items: [
    { q: 'What is your cancellation policy?', a: '60+ days before the event: 90% refund. 30–60 days: 50%. Under 30 days: non-refundable. Date changes are free up to 30 days out.' },
    { q: 'How long do refunds take?', a: 'Refunds are processed within 7 working days to the original payment method.' },
  ] },
];
