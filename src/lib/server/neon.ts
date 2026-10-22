import 'server-only';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let client: NeonQueryFunction<false, false> | undefined;

/** Lazily created so `next build` works without DATABASE_URL; fails loudly on first query instead. */
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set — see README "Database (Neon)"');
    client = neon(url);
  }
  return client(strings, ...values) as Promise<Record<string, unknown>[]>;
}
