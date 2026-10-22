import {
  BlogTeaser, CategoryStrip, CategoryTiles, DestinationCarousel, Hero, HowItWorks, Testimonials, TrendingPackages, TrustLogos, TwoPaths, WhyUs,
} from '@/components/home/sections';
import { RecentlyViewed } from '@/components/home/RecentlyViewed';
import { TrackSectionViews } from '@/components/analytics/TrackSectionViews';

export default function HomePage() {
  return (
    <>
      <Hero />
      <CategoryStrip />
      <TrendingPackages />
      <DestinationCarousel />
      <CategoryTiles />
      <RecentlyViewed />
      <TwoPaths />
      <HowItWorks />
      <WhyUs />
      <Testimonials />
      <BlogTeaser />
      <TrustLogos />
      <TrackSectionViews sections={{ testimonials: 'testimonial_viewed' }} />
    </>
  );
}
