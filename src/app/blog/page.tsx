import type { Metadata } from 'next';
import { blogPosts } from '@/lib/data/content';
import { BlogCard } from '@/components/home/sections';
import { Breadcrumbs, SectionHeading } from '@/components/ui/misc';

export const metadata: Metadata = { title: 'Ideas & Guides', description: 'Wedding budgets, destination guides, party themes and planning checklists from Crown & Co. planners.' };

export default function BlogIndexPage() {
  return (
    <div className="container py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Ideas & guides' }]} />
      <SectionHeading className="mt-4" eyebrow="Ideas & guides" title="Plan smarter with our experts" description="Budgets, checklists and inspiration from 12,000+ celebrations." />
      <div className="grid gap-6 pb-10 md:grid-cols-2 lg:grid-cols-3">{blogPosts.map(p => <BlogCard key={p.slug} post={p} />)}</div>
    </div>
  );
}
