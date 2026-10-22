import type { Destination } from '@/types';
import { PHOTOS } from './images';

export const destinations: Destination[] = [
  { slug: 'jaipur', name: 'Jaipur', region: 'Rajasthan', country: 'India', image: PHOTOS.jaipur, bestTime: 'Oct – Mar', venues: 140,
    about: 'The Pink City’s palaces and havelis make for royal weddings, grand sangeets and photo-perfect pre-wedding shoots.' },
  { slug: 'goa', name: 'Goa', region: 'Goa', country: 'India', image: PHOTOS.goa, bestTime: 'Nov – Feb', venues: 210,
    about: 'Sunset beach ceremonies, Portuguese villas and the best after-parties in the country.' },
  { slug: 'kerala', name: 'Kerala', region: 'Kerala', country: 'India', image: PHOTOS.kerala, bestTime: 'Sep – Mar', venues: 85,
    about: 'Backwater houseboats, coconut groves and serene resorts for intimate weddings and wellness retreats.' },
  { slug: 'mumbai', name: 'Mumbai', region: 'Maharashtra', country: 'India', image: PHOTOS.mumbai, bestTime: 'Nov – Feb', venues: 320,
    about: 'India’s event capital — sea-facing ballrooms, rooftop lounges and world-class production crews.' },
  { slug: 'agra', name: 'Agra', region: 'Uttar Pradesh', country: 'India', image: PHOTOS.agra, bestTime: 'Oct – Mar', venues: 40,
    about: 'Celebrate love in the shadow of the Taj — proposals, anniversaries and heritage pre-wedding shoots.' },
  { slug: 'jaisalmer', name: 'Jaisalmer', region: 'Rajasthan', country: 'India', image: PHOTOS.jaisalmer, bestTime: 'Nov – Feb', venues: 35,
    about: 'Golden forts and desert camps for starlit sangeets and one-of-a-kind destination weddings.' },
  { slug: 'himachal', name: 'Himachal', region: 'Himachal Pradesh', country: 'India', image: PHOTOS.himachal, bestTime: 'Mar – Jun, Dec – Jan', venues: 60,
    about: 'Mountain resorts in Manali, Shimla and Dharamshala for offsites, elopements and snowy shoots.' },
  { slug: 'phuket', name: 'Phuket', region: 'Phuket', country: 'Thailand', image: PHOTOS.phuket, bestTime: 'Nov – Apr', venues: 50, international: true,
    about: 'Island weddings on turquoise beaches with easy visas and luxury resorts for your whole guest list.' },
];
