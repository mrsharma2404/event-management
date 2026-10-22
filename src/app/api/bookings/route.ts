import { NextResponse } from 'next/server';
import { bookingRequestSchema } from '@/lib/validation';
import { getDestination, getPackage } from '@/lib/catalog';
import { balanceDueDate, clampGuests, findCoupon, quote } from '@/lib/pricing';
import { minEventDate } from '@/lib/format';
import { unsplash } from '@/lib/data/images';
import { bookingsRepo } from '@/lib/server/db';
import { attributionFromHeaders, trackServer } from '@/lib/server/analytics';
import { badRequest, idsParam } from '@/lib/server/http';

export async function POST(req: Request) {
  const parsed = bookingRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest('Invalid booking request', parsed.error.issues);
  const body = parsed.data;

  const pkg = getPackage(body.packageSlug);
  if (!pkg) return badRequest('This package is no longer available');
  if (body.date < minEventDate()) return badRequest('Event date must be at least 7 days from today');
  if (clampGuests(pkg, body.guests) !== body.guests)
    return badRequest(`Guest count must be between ${pkg.guests.min} and ${pkg.guests.max}`);
  if (body.coupon && !findCoupon(body.coupon)) return badRequest('Coupon is not valid');

  // Never trust client-side totals: recompute from the catalogue.
  const q = quote(pkg, body);
  const amountPaid = body.paymentMode === 'full' ? q.fullPayment : q.advance;
  const balance = body.paymentMode === 'full' ? 0 : q.total - q.advance;

  // TODO: create a payment order with the gateway (Razorpay/Stripe) and confirm via webhook.
  const record = await bookingsRepo.create({
    ...body,
    coupon: body.coupon ? findCoupon(body.coupon)!.code : null,
    packageTitle: pkg.title,
    packageImage: unsplash(pkg.images[0], 400),
    destinationName: getDestination(pkg.destination)?.name ?? '',
    quote: q,
    amountPaid,
    balance,
    balanceDueDate: balance ? balanceDueDate(body.date) : null,
    status: 'confirmed',
  }, attributionFromHeaders(req.headers));

  const conversion = {
    booking_id: record.id, package_slug: pkg.slug, category: pkg.category, destination: pkg.destination,
    tier: record.tier, guests: record.guests, event_date: record.date, value: record.quote.total,
    amount_paid: amountPaid, currency: 'INR', payment_mode: record.paymentMode, payment_method: record.paymentMethod,
    coupon: record.coupon, addons: record.addons,
  };
  await Promise.all([trackServer(req, 'order_created', conversion), trackServer(req, 'booking_confirmed', conversion)]);
  return NextResponse.json(record, { status: 201 });
}

export async function GET(req: Request) {
  return NextResponse.json(await bookingsRepo.many(idsParam(req)));
}
