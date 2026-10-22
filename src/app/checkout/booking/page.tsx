import type { Metadata } from 'next';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';
import { CheckoutGuard } from '@/components/checkout/CheckoutGuard';
import { BookingDetailsForm } from '@/components/checkout/BookingDetailsForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';

export const metadata: Metadata = { title: 'Booking Details' };

export default function BookingDetailsPage() {
  return (
    <>
      <CheckoutStepper current={1} />
      <CheckoutGuard>
        <div className="grid items-start gap-7 pb-16 lg:grid-cols-[minmax(0,1fr)_380px]">
          <BookingDetailsForm />
          <OrderSummary withCoupon />
        </div>
      </CheckoutGuard>
    </>
  );
}
