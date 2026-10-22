'use client';

import { Button } from '@/components/ui/Button';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container py-24 text-center">
      <h1 className="mb-2 font-serif text-3xl font-bold">Something went wrong</h1>
      <p className="mb-6 text-ink-400">Please try again. If the problem continues, contact us on WhatsApp.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
