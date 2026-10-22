import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { EventPackage } from '@/types';
import { getCategory, getDestination } from '@/lib/catalog';
import { discountPercent, guestLabel, inr } from '@/lib/format';
import { SmartImage } from '@/components/ui/SmartImage';
import { Badge, RatingBadge } from '@/components/ui/misc';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { WishlistButton } from './WishlistButton';
import { cn } from '@/lib/cn';

/** `position` and `list` are analytics context: where in which result list the card was clicked. */
export function PackageCard({ pkg, priority, position, list }: { pkg: EventPackage; priority?: boolean; position?: number; list?: string }) {
  const cat = getCategory(pkg.category)!;
  const dest = getDestination(pkg.destination)!;
  return (
    <Link href={`/packages/${pkg.slug}`}
      data-track="listing_result_clicked" data-track-package-slug={pkg.slug} data-track-category={pkg.category}
      data-track-destination={pkg.destination} data-track-price={pkg.price} data-track-position={position} data-track-list={list}
      className="group flex flex-col overflow-hidden rounded-[14px] bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden">
        <SmartImage photo={pkg.images[0]} width={600} fill priority={priority} sizes="(max-width:640px) 100vw, (max-width:1080px) 50vw, 25vw"
          alt={pkg.title} className="transition duration-500 group-hover:scale-105" />
        {pkg.tag && <Badge className="absolute left-3 top-3">{pkg.tag}</Badge>}
        <WishlistButton slug={pkg.slug} className="absolute right-2.5 top-2.5" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 pb-[18px]">
        <div className="flex justify-between text-[0.76rem] font-medium text-ink-400">
          <span className="flex items-center gap-1"><CategoryIcon name={cat.icon} className="h-3.5 w-3.5" />{cat.name}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{dest.name}</span>
        </div>
        <h3 className="line-clamp-2 min-h-[2.8em] font-sans text-base font-semibold leading-snug">{pkg.title}</h3>
        <div className="flex flex-wrap items-center gap-1.5 text-[0.8rem] text-ink-600">
          <RatingBadge rating={pkg.rating} /><span className="text-ink-400">({pkg.reviewCount})</span>
          <span className="text-line">•</span><span>{pkg.duration}</span>
          <span className="text-line">•</span><span>{guestLabel(pkg.guests)}</span>
        </div>
        <div className="mt-auto flex items-end justify-between border-t border-dashed border-line pt-3">
          <div>
            <span className="text-xs text-ink-400">Starting from</span>
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <strong className="text-lg">{inr(pkg.price)}</strong>
              <s className="text-xs text-ink-400">{inr(pkg.mrp)}</s>
              <span className="text-xs font-bold text-success">{discountPercent(pkg.price, pkg.mrp)}% off</span>
            </div>
          </div>
          <span className={cn('rounded-full px-3.5 py-1.5 text-[0.8rem] font-semibold', pkg.enquiryFirst ? 'border-[1.5px] border-brand-600 text-brand-700' : 'bg-brand text-ink')}>
            {pkg.enquiryFirst ? 'Get Quote' : 'View'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function PackageGrid({ items, className, list }: { items: EventPackage[]; className?: string; list?: string }) {
  return (
    <div className={cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {items.map((p, i) => <PackageCard key={p.slug} pkg={p} priority={i < 3} position={i + 1} list={list} />)}
    </div>
  );
}
