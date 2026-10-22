'use client';

import { Heart } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHydrated } from '@/hooks/useHydrated';
import { toggleWishlist } from '@/store/slices/wishlistSlice';
import { showToast } from '@/store/slices/uiSlice';
import { selectIsWishlisted } from '@/store/selectors';
import { cn } from '@/lib/cn';

export function WishlistButton({ slug, className, withLabel }: { slug: string; className?: string; withLabel?: boolean }) {
  const dispatch = useAppDispatch();
  const hydrated = useHydrated();
  const saved = useAppSelector(selectIsWishlisted(slug)) && hydrated;
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(toggleWishlist(slug));
        dispatch(showToast(saved ? 'Removed from wishlist' : 'Saved to your wishlist'));
      }}
      className={cn('grid place-items-center rounded-full bg-white/95 text-brand-700 shadow-sm transition hover:scale-105', withLabel ? 'h-11 gap-2 border-[1.5px] border-line px-4 [display:flex]' : 'h-9 w-9', className)}
    >
      <Heart className={cn('h-[18px] w-[18px]', saved && 'fill-current')} />
      {withLabel && <span className="text-sm font-semibold">{saved ? 'Saved' : 'Save'}</span>}
    </button>
  );
}
