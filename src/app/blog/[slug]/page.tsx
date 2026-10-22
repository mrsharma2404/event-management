import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { blogPosts } from '@/lib/data/content';
import { formatDate } from '@/lib/format';
import { SmartImage } from '@/components/ui/SmartImage';
import { BlogCard } from '@/components/home/sections';
import { Breadcrumbs } from '@/components/ui/misc';
import { EnquiryForm } from '@/components/enquiry/EnquiryForm';

type Props = { params: Promise<{ slug: string }> };

/** Every valid slug is known at build time; anything else is a real 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return blogPosts.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find(p => p.slug === slug);
  return post ? { title: post.title, description: post.excerpt } : {};
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find(p => p.slug === slug);
  if (!post) notFound();
  const more = blogPosts.filter(p => p.slug !== post.slug).slice(0, 3);
  return (
    <article className="container py-10">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Ideas & guides', href: '/blog' }, { label: post.category }]} />
      <header className="mx-auto mt-6 max-w-3xl text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-gold">{post.category}</span>
        <h1 className="my-3 font-serif text-[clamp(1.8rem,4vw,2.8rem)] font-bold leading-tight">{post.title}</h1>
        <p className="text-sm text-ink-400">By {post.author} · {formatDate(post.date, { day: 'numeric', month: 'long', year: 'numeric' })} · {post.readMinutes} min read</p>
      </header>
      <div className="relative mx-auto my-8 aspect-[16/8] max-w-5xl overflow-hidden rounded-xl2">
        <SmartImage photo={post.image} width={1600} fill priority sizes="(max-width:1024px) 100vw, 1024px" alt="" />
      </div>
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5 text-[1.05rem] leading-8 text-ink-600">
          <p className="font-serif text-xl italic text-ink">{post.excerpt}</p>
          {post.body.map((para, i) => <p key={i}>{para}</p>)}
        </div>
        <aside className="h-fit rounded-xl2 border-t-4 border-gold bg-white p-6 shadow-card lg:sticky lg:top-[92px]">
          <h3 className="font-serif text-lg font-bold">Planning something?</h3>
          <p className="mb-4 text-sm text-ink-400">Get a free plan from our experts.</p>
          <EnquiryForm compact idPrefix="blog" context={{ source: `blog:${post.slug}` }} />
        </aside>
      </div>
      <section className="mt-16">
        <h2 className="mb-5 font-serif text-2xl font-bold">Keep reading</h2>
        <div className="grid gap-5 md:grid-cols-3">{more.map(p => <BlogCard key={p.slug} post={p} />)}</div>
      </section>
    </article>
  );
}
