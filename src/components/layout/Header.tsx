'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, Heart, Menu, Phone, User, X, LogOut, CalendarCheck } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from '@/components/ui/Button';
import { SmartImage } from '@/components/ui/SmartImage';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { categories, destinations } from '@/lib/catalog';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHydrated } from '@/hooks/useHydrated';
import { openAuth, openEnquiry, setMobileNav } from '@/store/slices/uiSlice';
import { loggedOut } from '@/store/slices/accountSlice';
import { cn } from '@/lib/cn';

function TopBar() {
  return (
    <div className="bg-ink text-[0.78rem] text-cream-200">
      <div className="container flex justify-between gap-3 py-1.5">
        <span>✦ Flat 3% off when you pay in full · Free planner consultation</span>
        <a href="tel:+919876543210" className="hidden items-center gap-1.5 hover:text-white sm:flex"><Phone className="h-3.5 w-3.5" /> +91 98765 43210</a>
      </div>
    </div>
  );
}

function MegaMenu({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="group relative">
      <button className="flex items-center gap-1 rounded-lg px-3.5 py-2.5 font-medium text-ink-600 hover:bg-cream-100 hover:text-brand-700">
        {label} <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
      </button>
      <div className={cn(
        'invisible absolute left-0 top-full z-50 translate-y-1.5 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100',
      )}>
        <div className={cn('grid gap-0.5 rounded-xl bg-white p-2.5 shadow-lift', wide ? 'w-[420px] grid-cols-2' : 'w-72')}>{children}</div>
      </div>
    </div>
  );
}

const menuLink = 'flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium hover:bg-cream-100 hover:text-brand-700';

function AccountMenu() {
  const dispatch = useAppDispatch();
  const hydrated = useHydrated();
  const storedUser = useAppSelector(s => s.account.user);
  const user = hydrated ? storedUser : null;
  const [open, setOpen] = useState(false);
  if (!user) {
    return (
      <button onClick={() => dispatch(openAuth())} className="hidden items-center gap-1.5 rounded-lg px-3 py-2 font-medium text-ink-600 hover:bg-cream-100 hover:text-brand-700 md:flex">
        <User className="h-4 w-4" /> Log in
      </button>
    );
  }
  return (
    <div className="relative hidden md:block" onMouseLeave={() => setOpen(false)}>
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-cream-100" aria-expanded={open}>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-bold text-ink">{user.name[0]?.toUpperCase()}</span>
        <span className="text-sm font-semibold">{user.name.split(' ')[0]}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 w-56 pt-2">
          <div className="rounded-xl bg-white p-2 shadow-lift">
            <Link href="/account" className={menuLink}><CalendarCheck className="h-4 w-4" /> My bookings</Link>
            <Link href="/wishlist" className={menuLink}><Heart className="h-4 w-4" /> Wishlist</Link>
            <button onClick={() => dispatch(loggedOut())} className={cn(menuLink, 'w-full text-left')}><LogOut className="h-4 w-4" /> Log out</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const mobileOpen = useAppSelector(s => s.ui.mobileNavOpen);
  const hydrated = useHydrated();
  const wishCount = useAppSelector(s => (hydrated ? s.wishlist.slugs.length : 0));
  const user = useAppSelector(s => (hydrated ? s.account.user : null));
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { dispatch(setMobileNav(false)); }, [pathname, dispatch]);

  const navLink = (href: string, label: string) => (
    <Link href={href} className={cn('rounded-lg px-3.5 py-2.5 font-medium text-ink-600 hover:bg-cream-100 hover:text-brand-700', pathname.startsWith(href) && 'text-brand-700')}>
      {label}
    </Link>
  );

  return (
    <>
      <TopBar />
      <header className={cn('sticky top-0 z-50 border-b bg-cream/90 backdrop-blur-md transition', scrolled ? 'border-line shadow-[0_4px_20px_rgba(42,29,23,.06)]' : 'border-transparent')}>
        <div className="container flex h-[72px] items-center gap-6">
          <Logo />
          <nav className="hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Main">
            <MegaMenu label="Events">
              {categories.map(c => (
                <Link key={c.slug} href={`/events/${c.slug}`} className={menuLink}>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-cream-100 text-brand-700"><CategoryIcon name={c.icon} className="h-4 w-4" /></span>
                  {c.name}
                </Link>
              ))}
              <Link href="/events" className="mt-1 border-t border-line px-3 pt-2.5 text-sm font-semibold text-brand-700">All occasions →</Link>
            </MegaMenu>
            <MegaMenu label="Destinations" wide>
              {destinations.map(d => (
                <Link key={d.slug} href={`/destinations/${d.slug}`} className={menuLink}>
                  <SmartImage photo={d.image} width={80} alt="" className="h-9 w-9 rounded-lg" />
                  <span>{d.name}<span className="block text-xs font-normal text-ink-400">{d.country === 'India' ? d.region : d.country}</span></span>
                </Link>
              ))}
            </MegaMenu>
            {navLink('/packages', 'All Packages')}
            {navLink('/plan-my-event', 'Plan My Event')}
            {navLink('/blog', 'Ideas')}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/wishlist" className="relative rounded-full p-2.5 text-ink-600 hover:bg-cream-100 hover:text-brand-700" aria-label={`Wishlist (${wishCount})`}>
              <Heart className="h-5 w-5" />
              {wishCount > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[0.65rem] font-bold text-ink">{wishCount}</span>}
            </Link>
            <AccountMenu />
            <Button size="sm" className="hidden sm:inline-flex" onClick={() => dispatch(openEnquiry({ source: 'header' }))}>Get a Quote</Button>
            <button className="grid h-10 w-10 place-items-center rounded-lg border border-line lg:hidden" aria-label="Menu" aria-expanded={mobileOpen}
              onClick={() => dispatch(setMobileNav(!mobileOpen))}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="max-h-[calc(100vh-72px)] overflow-y-auto border-t border-line bg-cream px-4 pb-6 pt-3 shadow-lift lg:hidden">
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Occasions</p>
            <div className="grid grid-cols-2">
              {categories.map(c => <Link key={c.slug} href={`/events/${c.slug}`} className={cn(menuLink, 'text-sm')}><CategoryIcon name={c.icon} className="h-4 w-4 text-brand-700" />{c.name}</Link>)}
            </div>
            <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Destinations</p>
            <div className="grid grid-cols-2">
              {destinations.map(d => <Link key={d.slug} href={`/destinations/${d.slug}`} className={cn(menuLink, 'text-sm')}>{d.name}</Link>)}
            </div>
            <div className="mt-3 grid border-t border-line pt-3">
              <Link href="/packages" className={menuLink}>All packages</Link>
              <Link href="/plan-my-event" className={menuLink}>Plan my event</Link>
              <Link href="/blog" className={menuLink}>Ideas & guides</Link>
              {user ? <Link href="/account" className={menuLink}>My bookings</Link> : <button onClick={() => dispatch(openAuth())} className={cn(menuLink, 'text-left')}>Log in / Sign up</button>}
            </div>
            <Button block className="mt-4" onClick={() => dispatch(openEnquiry({ source: 'mobile-nav' }))}>Get a Free Quote</Button>
          </div>
        )}
      </header>
    </>
  );
}
