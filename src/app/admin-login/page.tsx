import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/server/adminAuth';
import { Logo } from '@/components/layout/Logo';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Admin sign in', robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect('/dashboard');
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="rounded-xl2 bg-white p-7 shadow-card">
          <h1 className="mb-1 font-serif text-2xl font-bold">Admin sign in</h1>
          <p className="mb-6 text-sm text-ink-400">Sign in to view the dashboard.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
