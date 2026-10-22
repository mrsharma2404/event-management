import { NextResponse } from 'next/server';
import { getPackage } from '@/lib/catalog';
import { notFound } from '@/lib/server/http';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const pkg = getPackage((await params).slug);
  return pkg ? NextResponse.json(pkg) : notFound('Package not found');
}
