import type { Metadata } from 'next';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';
import { Confirmation } from '@/components/checkout/Confirmation';

export const metadata: Metadata = { title: 'Booking Confirmed' };

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <div data-no-print><CheckoutStepper current={3} /></div>
      <Confirmation id={id} />
    </>
  );
}
