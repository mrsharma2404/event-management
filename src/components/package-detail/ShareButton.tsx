'use client';

import { Share2 } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { showToast } from '@/store/slices/uiSlice';
import { track } from '@/lib/analytics/client';

export function ShareButton({ title }: { title: string }) {
  const dispatch = useAppDispatch();
  const share = async () => {
    const method = 'share' in navigator ? 'native' : 'copy_link';
    track('event_share_clicked', { method });
    try {
      if (navigator.share) await navigator.share({ title, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        track('share_link_copied');
        dispatch(showToast('Link copied to clipboard'));
      }
    } catch { /* user cancelled */ }
  };
  return (
    <button onClick={share} className="flex h-11 items-center gap-2 rounded-full border-[1.5px] border-line bg-white px-4 text-sm font-semibold hover:border-brand-600 hover:text-brand-700">
      <Share2 className="h-4 w-4" /> Share
    </button>
  );
}
