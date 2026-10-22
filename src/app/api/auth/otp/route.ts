import { NextResponse } from 'next/server';
import { z } from 'zod';
import { otpRepo } from '@/lib/server/db';
import { badRequest } from '@/lib/server/http';

const schema = z.object({ phone: z.string().regex(/^[6-9]\d{9}$/) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return badRequest('Enter a valid 10-digit mobile number');
  const code = await otpRepo.issue(parsed.data.phone);
  return NextResponse.json({ sent: true, demoCode: code });
}
