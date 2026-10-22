import 'server-only';
import type { BookingRecord, EnquiryRecord } from '@/types';
import { sql } from './neon';

/**
 * Repositories backed by Neon Postgres (schema in db/schema.sql). The full record is kept in `data`;
 * the columns alongside it exist for querying and joining with analytics_events.
 */

const shortId = (prefix: string) =>
  prefix + Date.now().toString(36).toUpperCase().slice(-5) + Math.random().toString(36).slice(2, 5).toUpperCase();

/** Visitor ids sent by the client tracker, so a conversion can be joined to its session's events. */
export interface Attribution {
  anonymousId: string | null;
  sessionId: string | null;
}

export const bookingsRepo = {
  async create(data: Omit<BookingRecord, 'id' | 'createdAt'>, attr: Attribution): Promise<BookingRecord> {
    const record: BookingRecord = { ...data, id: shortId('CS'), createdAt: new Date().toISOString() };
    await sql`
      INSERT INTO bookings (id, created_at, status, package_slug, event_date, guests, amount_paid, total, phone, email, anonymous_id, session_id, data)
      VALUES (${record.id}, ${record.createdAt}, ${record.status}, ${record.packageSlug}, ${record.date}, ${record.guests},
              ${record.amountPaid}, ${record.quote.total}, ${record.contact.phone}, ${record.contact.email},
              ${attr.anonymousId}, ${attr.sessionId}, ${JSON.stringify(record)})`;
    return record;
  },
  async get(id: string) {
    const rows = await sql`SELECT data FROM bookings WHERE id = ${id}`;
    return (rows[0]?.data as BookingRecord | undefined) ?? null;
  },
  async many(ids: string[]) {
    if (!ids.length) return [];
    const rows = await sql`SELECT data FROM bookings WHERE id = ANY(${ids}) ORDER BY created_at DESC`;
    return rows.map(r => r.data as BookingRecord);
  },
};

export const enquiriesRepo = {
  async create(data: Omit<EnquiryRecord, 'id' | 'createdAt' | 'status'>, attr: Attribution): Promise<EnquiryRecord> {
    const record: EnquiryRecord = { ...data, id: shortId('EQ'), createdAt: new Date().toISOString(), status: 'new' };
    await sql`
      INSERT INTO enquiries (id, created_at, status, source, package_slug, category, destination, phone, anonymous_id, session_id, data)
      VALUES (${record.id}, ${record.createdAt}, ${record.status}, ${record.source}, ${record.packageSlug ?? null},
              ${record.category || null}, ${record.destination || null}, ${record.phone},
              ${attr.anonymousId}, ${attr.sessionId}, ${JSON.stringify(record)})`;
    return record;
  },
  async many(ids: string[]) {
    if (!ids.length) return [];
    // `status` lives in its own column so the sales team can update it without rewriting `data`.
    const rows = await sql`SELECT data, status FROM enquiries WHERE id = ANY(${ids}) ORDER BY created_at DESC`;
    return rows.map(r => ({ ...(r.data as EnquiryRecord), status: r.status as EnquiryRecord['status'] }));
  },
};

export const otpRepo = {
  async issue(phone: string) {
    const code = '123456'; // Demo: fixed code. Replace with SMS provider + random code.
    await sql`
      INSERT INTO otps (phone, code, expires_at) VALUES (${phone}, ${code}, now() + interval '5 minutes')
      ON CONFLICT (phone) DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at`;
    return code;
  },
  async verify(phone: string, code: string) {
    const rows = await sql`DELETE FROM otps WHERE phone = ${phone} AND code = ${code} AND expires_at > now() RETURNING phone`;
    return rows.length > 0;
  },
};
