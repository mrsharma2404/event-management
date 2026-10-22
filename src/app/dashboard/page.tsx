import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { getAdminSession } from '@/lib/server/adminAuth';
import { analyticsOverview, latestModelRun, parseRange, type ModelRun } from '@/lib/server/adminAnalytics';
import { formatDate } from '@/lib/format';
import { Logo } from '@/components/layout/Logo';
import { cn } from '@/lib/cn';
import { logout } from '../admin-login/actions';
import { Dashboard, type DashboardData } from './Dashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Dashboard', robots: { index: false, follow: false } };

const RANGES = [7, 30, 90];
const TZ = 'Asia/Kolkata';
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  if (!(await getAdminSession())) redirect('/admin-login');

  const requested = Number((await searchParams).days);
  const days = RANGES.includes(requested) ? requested : 30;
  const to = new Date().toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD in IST
  const from = new Date(Date.parse(to) - (days - 1) * 86_400_000).toISOString().slice(0, 10);

  let data: DashboardData | null = null;
  let model: ModelRun | null = null;
  try {
    [data, model] = await Promise.all([analyticsOverview(parseRange(new URLSearchParams({ from, to, tz: TZ }))), latestModelRun()]);
  } catch (e) {
    console.error('[dashboard]', e);
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-white">
        <div className="container flex h-16 items-center gap-4">
          <Logo />
          <span className="hidden rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold text-ink-600 sm:inline">Admin</span>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/" className="hidden text-sm font-medium text-ink-600 hover:text-brand-700 sm:inline">View site</Link>
            <form action={logout}>
              <button className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium hover:border-brand-600">
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
            <p className="text-sm text-ink-400">{formatDate(from)} – {formatDate(to)} · compared with the previous {days} days</p>
          </div>
          <nav className="flex rounded-full bg-white p-1 shadow-card" aria-label="Date range">
            {RANGES.map(d => (
              <Link key={d} href={`/dashboard?days=${d}`} aria-current={d === days ? 'page' : undefined}
                className={cn('rounded-full px-4 py-1.5 text-sm font-medium', d === days ? 'bg-ink text-cream' : 'text-ink-600 hover:text-ink')}>
                {d} days
              </Link>
            ))}
          </nav>
        </div>

        {data ? <Dashboard data={data} model={model} /> : (
          <div className="rounded-xl2 bg-white p-10 text-center shadow-card">
            <h2 className="mb-1 font-serif text-xl font-bold">Couldn’t load the data</h2>
            <p className="text-ink-400">Check that DATABASE_URL is set and the tables exist (npm run db:migrate). Details are in the server logs.</p>
          </div>
        )}
      </main>
    </div>
  );
}
