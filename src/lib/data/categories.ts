import type { Category } from '@/types';
import { PHOTOS } from './images';

export const categories: Category[] = [
  {
    slug: 'weddings', name: 'Weddings', singular: 'wedding', icon: 'gem', image: PHOTOS.weddingKiss,
    tagline: 'From roka to vidaai — planned end to end',
    about: 'Full-service wedding planning with curated venues, decor, catering, photography and a dedicated planner who stays with you from the first call to the last dance.',
  },
  {
    slug: 'destination-weddings', name: 'Destination Weddings', singular: 'destination wedding', icon: 'castle', image: PHOTOS.aisle,
    tagline: 'Palaces, beaches and backwaters',
    about: 'Say your vows at a heritage fort, a beachfront resort or a lakeside villa. We handle guest travel, stays, hospitality desks and every ceremony in between.',
  },
  {
    slug: 'pre-wedding', name: 'Pre-Wedding Shoots', singular: 'pre-wedding shoot', icon: 'camera', image: PHOTOS.coupleHills,
    tagline: 'Your story, beautifully framed',
    about: 'Cinematic pre-wedding shoots at iconic locations with styling, permits, travel and a same-week teaser reel.',
  },
  {
    slug: 'birthdays', name: 'Birthday Parties', singular: 'birthday party', icon: 'cake', image: PHOTOS.balloons,
    tagline: 'Themed parties for every age',
    about: 'Kids’ theme parties, milestone birthdays and surprise celebrations — decor, entertainment, cake and food sorted.',
  },
  {
    slug: 'corporate', name: 'Corporate Events', singular: 'corporate event', icon: 'building', image: PHOTOS.conference,
    tagline: 'Offsites, launches and conferences',
    about: 'Conferences, product launches, annual days and team offsites with AV, stage production, travel and on-ground ops.',
  },
  {
    slug: 'concerts', name: 'Concerts & Shows', singular: 'concert', icon: 'mic', image: PHOTOS.concertPhone,
    tagline: 'Live music and stage production',
    about: 'Book artists, comedians and full-scale stage production for private shows, college fests and brand activations.',
  },
  {
    slug: 'private-parties', name: 'Private Parties', singular: 'private party', icon: 'wine', image: PHOTOS.cheers,
    tagline: 'Anniversaries, proposals & soirées',
    about: 'Intimate dinners, surprise proposals, anniversaries and house parties — curated down to the playlist.',
  },
];
