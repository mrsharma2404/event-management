'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { EventPackage } from '@/types';
import { PackageCard } from '@/components/packages/PackageCard';
import { EmptyState } from '@/components/ui/misc';
import { EnquireButton } from '@/components/enquiry/EnquireButton';
import { cn } from '@/lib/cn';
import { track } from '@/lib/analytics/client';

interface Props {
  items: EventPackage[];
  /** Which field the chips filter on — destination on a category page, category on a destination page. */
  chipKey: 'destination' | 'category';
  chips: { value: string; label: string }[];
  enquiryContext: { category?: string; destination?: string };
}

export function FilterablePackages({ items, chipKey, chips, enquiryContext }: Props) {
  const [active, setActive] = useState('');
  const list = useMemo(() => (active ? items.filter(p => p[chipKey] === active) : items), [items, active, chipKey]);

  const chip = (value: string, label: string) => (
    <button key={value} aria-pressed={active === value}
      onClick={() => {
        setActive(value);
        if (!value) return;
        const props = { [chipKey]: value, cta_location: 'collection_chips', result_count: items.filter(p => p[chipKey] === value).length };
        track(chipKey === 'destination' ? 'location_clicked' : 'listing_category_clicked', props);
      }}
      className={cn('rounded-full border-[1.5px] px-4 py-2 text-sm font-medium transition',
        active === value ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-line bg-white hover:border-brand-600 hover:text-brand-700')}>
      {label}
    </button>
  );

  return (
    <>
      {chips.length > 1 && <div className="mb-5 flex flex-wrap gap-2">{chip('', 'All')}{chips.map(c => chip(c.value, c.label))}</div>}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {list.length ? list.map((p, i) => <PackageCard key={p.slug} pkg={p} position={i + 1} list="collection" />) : (
          <EmptyState icon={<Search className="h-7 w-7" />} title="No packages listed yet"
            description="We still plan events here — send us an enquiry and a planner will build a custom package."
            action={<EnquireButton context={{ ...enquiryContext, source: 'collection-empty' }}>Get a Custom Quote</EnquireButton>} />
        )}
      </div>
    </>
  );
}
