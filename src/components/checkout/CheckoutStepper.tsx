import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

const STEPS = ['Package', 'Booking details', 'Payment', 'Confirmed'];

export function CheckoutStepper({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2.5 py-7 text-sm font-semibold text-ink-400" aria-label="Checkout progress">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2.5" aria-current={i === current ? 'step' : undefined}>
          {i > 0 && <span className="hidden h-0.5 w-10 bg-line sm:block lg:w-16" />}
          <span className={cn('flex items-center gap-2', i === current && 'text-ink')}>
            <span className={cn('grid h-7 w-7 place-items-center rounded-full border-2 text-xs',
              i < current ? 'border-success bg-success text-white' : i === current ? 'border-brand-600 bg-brand text-ink' : 'border-line bg-white')}>
              {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            {s}
          </span>
        </li>
      ))}
    </ol>
  );
}
