import { NextResponse } from 'next/server';
import { findCoupon } from '@/lib/pricing';
import { badRequest } from '@/lib/server/http';

export async function POST(req: Request) {
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  const coupon = findCoupon(code);
  return coupon ? NextResponse.json(coupon) : badRequest('That coupon code isn’t valid');
}
