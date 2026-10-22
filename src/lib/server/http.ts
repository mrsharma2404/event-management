import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

export const badRequest = (message: string, issues?: ZodError['issues']) =>
  NextResponse.json({ message, issues }, { status: 400 });

export const notFound = (message = 'Not found') => NextResponse.json({ message }, { status: 404 });

export const idsParam = (req: Request) =>
  (new URL(req.url).searchParams.get('ids') ?? '').split(',').filter(Boolean).slice(0, 50);
