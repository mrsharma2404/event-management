'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CalendarCheck, Heart, LogOut, MessageSquareText, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHydrated } from '@/hooks/useHydrated';
import { useGetBookingsQuery, useGetEnquiriesQuery } from '@/store/api';
import { loggedOut } from '@/store/slices/accountSlice';
import { openAuth } from '@/store/slices/uiSlice';
import { formatDate, inr } from '@/lib/format';
import { getCategory, getDestination, getPackage } from '@/lib/catalog';
import { Button, ButtonLink } from '@/components/ui/Button';
import { EmptyState, Skeleton } from '@/components/ui/misc';
import { cn } from '@/lib/cn';

type Tab = 'bookings' | 'enquiries';

export function AccountDashboard() {
  const dispatch = useAppDispatch();
  const hydrated = useHydrated();
  const { user, bookingIds, enquiryIds } = useAppSelector(s => s.account);
  const wishCount = useAppSelector(s => s.wishlist.slugs.length);
  const [tab, setTab] = useState<Tab>('bookings');
  const bookings = useGetBookingsQuery(bookingIds, { skip: !hydrated || !bookingIds.length });
  const enquiries = useGetEnquiriesQuery(enquiryIds, { skip: !hydrated || !enquiryIds.length });

  if (!hydrated) return <Skeleton className="mb-16 h-96" />;

  return (
    <div className="grid items-start gap-7 pb-16 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-xl2 bg-white p-6 shadow-card">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand text-lg font-bold text-ink">{user ? user.name[0].toUpperCase() : <User className="h-5 w-5" />}</span>
          <div>
            <strong className="block">{user ? user.name : 'Guest'}</strong>
            <span className="text-sm text-ink-400">{user ? `+91 ${user.phone}` : 'Not logged in'}</span>
          </div>
        </div>
        <nav className="grid gap-1 text-sm font-semibold">
          {([['bookings', CalendarCheck, `My bookings (${bookingIds.length})`], ['enquiries', MessageSquareText, `My enquiries (${enquiryIds.length})`]] as const).map(([k, Icon, label]) => (
            <button key={k} onClick={() => setTab(k)} className={cn('flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left', tab === k ? 'bg-cream-100 text-brand-700' : 'hover:bg-cream')}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
          <Link href="/wishlist" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-cream"><Heart className="h-4 w-4" /> Wishlist ({wishCount})</Link>
          {user ? (
            <button onClick={() => dispatch(loggedOut())} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-cream"><LogOut className="h-4 w-4" /> Log out</button>
          ) : (
            <Button size="sm" className="mt-3" onClick={() => dispatch(openAuth())}>Log in / Sign up</Button>
          )}
        </nav>
        {!user && <p className="mt-4 text-xs text-ink-400">Bookings made on this device appear here. Log in to sync across devices.</p>}
      </aside>

      <div className="min-w-0">
        {tab === 'bookings' ? (
          bookings.isLoading ? <Skeleton className="h-48" /> : !bookings.data?.length ? (
            <EmptyState icon={<CalendarCheck className="h-7 w-7" />} title="No bookings yet" description="When you book a package, it will show up here with payment details and next steps."
              action={<ButtonLink href="/packages">Explore packages</ButtonLink>} />
          ) : (
            <div className="space-y-4">
              {bookings.data.map(b => (
                <article key={b.id} className="flex flex-col gap-4 rounded-xl2 bg-white p-5 shadow-card sm:flex-row">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.packageImage} alt="" className="h-28 w-full rounded-xl object-cover sm:w-40" />
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded bg-success/10 px-2 py-0.5 font-bold uppercase text-success">{b.status}</span>
                      <span className="text-ink-400">#{b.id}</span>
                    </div>
                    <Link href={`/packages/${b.packageSlug}`} className="font-semibold hover:text-brand-700">{b.packageTitle}</Link>
                    <div className="mt-1 text-sm text-ink-600">{formatDate(b.date)} · {b.destinationName} · {b.quote.tier.name} · {b.guests} guests</div>
                    <div className="mt-2 text-sm">Paid <strong className="text-success">{inr(b.amountPaid)}</strong>
                      {b.balance > 0 ? <> · Balance <strong>{inr(b.balance)}</strong> due {formatDate(b.balanceDueDate)}</> : ' · Fully paid'}
                    </div>
                  </div>
                  <ButtonLink href={`/checkout/confirmation/${b.id}`} variant="outline" size="sm" className="self-start">View</ButtonLink>
                </article>
              ))}
              {bookings.data.length < bookingIds.length && (
                <p className="text-xs text-ink-400">Some older bookings aren’t available in this demo (the in-memory server store resets on restart).</p>
              )}
            </div>
          )
        ) : enquiries.isLoading ? <Skeleton className="h-48" /> : !enquiries.data?.length ? (
          <EmptyState icon={<MessageSquareText className="h-7 w-7" />} title="No enquiries yet" description="Ask for a custom quote and track it here."
            action={<ButtonLink href="/plan-my-event">Plan my event</ButtonLink>} />
        ) : (
          <div className="space-y-3">
            {enquiries.data.map(e => (
              <article key={e.id} className="rounded-xl2 bg-white p-5 shadow-card">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded bg-gold/15 px-2 py-0.5 font-bold uppercase text-gold-700">Planner assigned</span>
                  <span className="text-ink-400">#{e.id} · {formatDate(e.createdAt)}</span>
                </div>
                <strong>{e.packageSlug ? getPackage(e.packageSlug)?.title : `${getCategory(e.category ?? '')?.name ?? 'Event'}${e.destination ? ` in ${getDestination(e.destination)?.name}` : ''}`}</strong>
                <div className="mt-1 text-sm text-ink-600">
                  {[e.date && formatDate(e.date), e.guests && `${e.guests} guests`, e.budget].filter(Boolean).join(' · ') || 'Details to be discussed'}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
