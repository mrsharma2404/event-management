import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="container py-24 text-center">
      <p className="font-serif text-7xl font-bold text-cream-200">404</p>
      <h1 className="mb-2 font-serif text-3xl font-bold">This page has left the party</h1>
      <p className="mx-auto mb-6 max-w-md text-ink-400">The page you’re looking for doesn’t exist or has moved. Let’s get you back to the celebrations.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Go home</ButtonLink>
        <ButtonLink href="/packages" variant="outline">Browse packages</ButtonLink>
      </div>
      <p className="mt-6 text-sm text-ink-400">Need help? <Link href="/contact" className="font-semibold text-brand-700">Contact us</Link></p>
    </div>
  );
}
