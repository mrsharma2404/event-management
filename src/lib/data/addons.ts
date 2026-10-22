import type { Addon, Coupon } from '@/types';

export const addons: Addon[] = [
  { key: 'drone', name: 'Drone cinematography', description: 'Aerial shots of venue & key moments', price: 18000 },
  { key: 'mua', name: 'Celebrity makeup artist', description: 'Bride/host + 2 family members', price: 25000 },
  { key: 'dhol', name: 'Live dhol & nashik baaja', description: '2 hours, 6 performers', price: 12000 },
  { key: 'photobooth', name: 'Instant photo booth', description: 'Props + unlimited prints', price: 9500 },
  { key: 'fireworks', name: 'Cold pyro & fireworks', description: 'Entry + finale effects', price: 22000 },
  { key: 'invites', name: 'Digital invite + RSVP site', description: 'Custom design, guest tracking', price: 6000 },
];

export const coupons: Coupon[] = [
  { code: 'STAR10', percent: 0.1, maxDiscount: 50000, label: '10% off up to ₹50,000' },
  { code: 'FIRSTCELEB', percent: 0.05, maxDiscount: 25000, label: '5% off up to ₹25,000 on your first booking' },
];
