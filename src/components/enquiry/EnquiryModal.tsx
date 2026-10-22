'use client';

import { useCallback, useState } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { closeEnquiry } from '@/store/slices/uiSlice';
import { getPackage } from '@/lib/catalog';
import { EnquiryForm } from './EnquiryForm';
import type { EnquiryRecord } from '@/types';

export function EnquiryModal() {
  const dispatch = useAppDispatch();
  const { open, context } = useAppSelector(s => s.ui.enquiry);
  const [done, setDone] = useState<EnquiryRecord | null>(null);
  const pkg = context.packageSlug ? getPackage(context.packageSlug) : undefined;

  const close = useCallback(() => {
    dispatch(closeEnquiry());
    setDone(null);
  }, [dispatch]);

  return (
    <Modal
      open={open}
      onClose={close}
      title={done ? undefined : 'Get a Custom Quote'}
      description={done ? undefined : pkg ? `For: ${pkg.title}` : 'Tell us about your event — a planner will call you within 2 hours.'}
    >
      {done ? (
        <div className="py-4 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-success text-white"><Check className="h-8 w-8" /></div>
          <h3 className="mb-2 font-serif text-2xl font-bold">Enquiry received!</h3>
          <p className="mb-5 text-ink-600">
            Your reference is <strong>{done.id}</strong>. A Crown & Co. planner will call or WhatsApp you on{' '}
            <strong>{done.phone}</strong> within 2 hours with curated options.
          </p>
          <Button onClick={close}>Done</Button>
        </div>
      ) : (
        // key resets the form whenever the modal is re-opened with a new context
        <EnquiryForm key={JSON.stringify(context)} context={{ ...context, category: context.category ?? pkg?.category, destination: context.destination ?? pkg?.destination }} compact idPrefix="modal" onSuccess={setDone} />
      )}
    </Modal>
  );
}
