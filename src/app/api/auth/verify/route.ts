import { NextResponse } from 'next/server';
import { z } from 'zod';
import { otpRepo } from '@/lib/server/db';
import { badRequest } from '@/lib/server/http';

const schema = z.object({ phone: z.string(), code: z.string().length(6), name: z.string().trim().min(2) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest('Enter your name and the 6-digit code');
  if (!(await otpRepo.verify(parsed.data.phone, parsed.data.code))) return badRequest('Incorrect or expired code');
  // TODO: issue a session cookie (e.g. NextAuth / iron-session).
  return NextResponse.json({ name: parsed.data.name, phone: parsed.data.phone });
}
