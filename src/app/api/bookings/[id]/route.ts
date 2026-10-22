import { NextResponse } from 'next/server';
import { bookingsRepo } from '@/lib/server/db';
import { notFound } from '@/lib/server/http';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const booking = await bookingsRepo.get((await params).id);
  return booking ? NextResponse.json(booking) : notFound('Booking not found');
}
