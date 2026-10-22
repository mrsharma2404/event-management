'use client';

import { ShoppingBag } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useHydrated } from '@/hooks/useHydrated';
import { selectDraftPackage } from '@/store/selectors';
import { EmptyState, Skeleton } from '@/components/ui/misc';
import { ButtonLink } from '@/components/ui/Button';

/** Renders children only when a booking draft exists (after localStorage hydration). */
export function CheckoutGuard({ requireDetails, children }: { requireDetails?: boolean; children: React.ReactNode }) {
  const hydrated = useHydrated();
  const pkg = useAppSelector(selectDraftPackage);
  const draft = useAppSelector(s => s.bookingDraft);

  if (!hydrated) {
    return (
      <div className="grid gap-7 pb-16 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5"><Skeleton className="h-64" /><Skeleton className="h-48" /></div>
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (!pkg || !draft.date) {
    return (
      <div className="pb-16">
        <EmptyState icon={<ShoppingBag className="h-7 w-7" />} title="No booking in progress"
          description="Pick a package and choose your date to start a booking."
          action={<ButtonLink href="/packages">Browse packages</ButtonLink>} />
      </div>
    );
  }
  if (requireDetails && !draft.contact) {
    return (
      <div className="pb-16">
        <EmptyState icon={<ShoppingBag className="h-7 w-7" />} title="Add your details first"
          description="We need your contact and event details before payment."
          action={<ButtonLink href="/checkout/booking">Continue booking</ButtonLink>} />
      </div>
    );
  }
  return <>{children}</>;
}
