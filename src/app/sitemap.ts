import type { MetadataRoute } from 'next';
import { categories, destinations, packages } from '@/lib/catalog';
import { blogPosts } from '@/lib/data/content';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '', '/packages', '/events', '/destinations', '/plan-my-event', '/blog', '/about', '/contact', '/faq',
    ...categories.map(c => `/events/${c.slug}`),
    ...destinations.map(d => `/destinations/${d.slug}`),
    ...packages.map(p => `/packages/${p.slug}`),
    ...blogPosts.map(p => `/blog/${p.slug}`),
  ];
  return paths.map(p => ({ url: `${BASE}${p}`, changeFrequency: 'weekly', priority: p === '' ? 1 : p.startsWith('/packages/') ? 0.8 : 0.6 }));
}
