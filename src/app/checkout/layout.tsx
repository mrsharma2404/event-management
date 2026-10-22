import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false } };

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <div className="container">{children}</div>;
}
