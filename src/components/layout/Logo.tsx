import Link from 'next/link';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Logo({ light }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Crown & Co. Events home">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand to-brand-600 text-ink shadow-sm">
        <Crown className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className={cn('flex flex-col font-serif text-[1.3rem] font-bold leading-none', light ? 'text-cream' : 'text-ink')}>
        Crown &amp; Co.
        <small className={cn('mt-1 font-sans text-[0.6rem] font-semibold tracking-[0.35em]', light ? 'text-brand' : 'text-brand-700')}>EVENTS</small>
      </span>
    </Link>
  );
}
