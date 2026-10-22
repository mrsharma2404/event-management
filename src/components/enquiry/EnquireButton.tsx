'use client';

import { Button } from '@/components/ui/Button';
import { useAppDispatch } from '@/store/hooks';
import { openEnquiry, type EnquiryContext } from '@/store/slices/uiSlice';

/** Any CTA that opens the global "Get a custom quote" modal. Safe to drop into server components. */
export function EnquireButton({ context, ...props }: { context?: EnquiryContext } & React.ComponentProps<typeof Button>) {
  const dispatch = useAppDispatch();
  return <Button type="button" onClick={() => dispatch(openEnquiry(context))} {...props} />;
}
