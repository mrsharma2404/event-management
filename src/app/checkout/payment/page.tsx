import type { Metadata } from 'next';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';
import { CheckoutGuard } from '@/components/checkout/CheckoutGuard';
import { PaymentPanel } from '@/components/checkout/PaymentPanel';

export const metadata: Metadata = { title: 'Secure Payment' };

export default function PaymentPage() {
  return (
    <>
      <CheckoutStepper current={2} />
      <CheckoutGuard requireDetails>
        <PaymentPanel />
      </CheckoutGuard>
    </>
  );
}
