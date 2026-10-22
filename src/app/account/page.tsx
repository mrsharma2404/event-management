import type { Metadata } from 'next';
import { AccountDashboard } from '@/components/account/AccountDashboard';

export const metadata: Metadata = { title: 'My Account', robots: { index: false } };

export default function AccountPage() {
  return (
    <div className="container">
      <h1 className="py-8 font-serif text-3xl font-bold">My account</h1>
      <AccountDashboard />
    </div>
  );
}
