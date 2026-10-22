import { NextResponse } from 'next/server';
import { filtersFromParams, searchPackages } from '@/lib/catalog';

export function GET(req: Request) {
  const filters = filtersFromParams(new URL(req.url).searchParams);
  const items = searchPackages(filters);
  return NextResponse.json({ total: items.length, items });
}
