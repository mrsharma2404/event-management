import { NextResponse } from 'next/server';
import { enquirySchema } from '@/lib/validation';
import { enquiriesRepo } from '@/lib/server/db';
import { attributionFromHeaders, trackServer } from '@/lib/server/analytics';
import { badRequest, idsParam } from '@/lib/server/http';

export async function POST(req: Request) {
  const parsed = enquirySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest('Please check the highlighted fields', parsed.error.issues);
  const { email, ...rest } = parsed.data;
  const record = await enquiriesRepo.create({ ...rest, email: email || undefined }, attributionFromHeaders(req.headers));
  const lead = {
    enquiry_id: record.id, form_source: record.source, package_slug: record.packageSlug, category: record.category || undefined,
    destination: record.destination || undefined, guests: record.guests, event_date: record.date || undefined, budget: record.budget || undefined,
  };
  await Promise.all([trackServer(req, 'lead_created', lead), trackServer(req, 'enquiry_confirmed', lead)]);
  // TODO: notify the sales team (CRM webhook / WhatsApp Business API).
  return NextResponse.json(record, { status: 201 });
}

export async function GET(req: Request) {
  return NextResponse.json(await enquiriesRepo.many(idsParam(req)));
}
