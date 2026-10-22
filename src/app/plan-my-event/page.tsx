import type { Metadata } from 'next';
import { Clock, Gift, Users } from 'lucide-react';
import { PlanWizard } from '@/components/enquiry/PlanWizard';
import { Eyebrow } from '@/components/ui/misc';

export const metadata: Metadata = {
  title: 'Plan My Event — Free Custom Quote',
  description: 'Answer 5 quick questions and get 3 curated event plans with transparent pricing from a dedicated planner — free, within 2 hours.',
};

export default function PlanMyEventPage() {
  return (
    <div className="container">
      <div className="mx-auto max-w-3xl py-12 text-center">
        <Eyebrow>Free planning service</Eyebrow>
        <h1 className="font-serif text-[clamp(1.9rem,4vw,2.8rem)] font-bold leading-tight">Tell us your dream. We’ll plan the rest.</h1>
        <p className="mt-3 text-lg text-ink-400">Answer 5 quick questions and get 3 curated plans with transparent pricing.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-6 text-sm text-ink-600">
          <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-700" /> Takes 60 seconds</span>
          <span className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-700" /> Dedicated planner</span>
          <span className="flex items-center gap-2"><Gift className="h-4 w-4 text-brand-700" /> 100% free, no obligation</span>
        </div>
      </div>
      <PlanWizard />
    </div>
  );
}
