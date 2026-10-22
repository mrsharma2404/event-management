import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Single admin account from env (ADMIN_USERNAME / ADMIN_PASSWORD). A successful login sets an httpOnly cookie
 * `<username>.<expiry>.<hmac>`; the HMAC key is ADMIN_SESSION_SECRET (or the password, so changing the password
 * signs everyone out).
 */

const COOKIE = 'cc_admin';
const MAX_AGE_S = 7 * 24 * 60 * 60;

// Default credentials for now; set ADMIN_USERNAME / ADMIN_PASSWORD in the environment to override them.
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';

const env = () => {
  const password = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  return {
    username: process.env.ADMIN_USERNAME || DEFAULT_USERNAME,
    password,
    secret: process.env.ADMIN_SESSION_SECRET || password,
  };
};

export const adminConfigured = () => !!(env().username && env().password);

const sign = (payload: string) => createHmac('sha256', env().secret).update(payload).digest('base64url');

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkCredentials(username: string, password: string) {
  if (!adminConfigured()) return false;
  // Evaluate both so timing doesn't reveal which one was wrong.
  const userOk = safeEqual(username, env().username);
  const passOk = safeEqual(password, env().password);
  return userOk && passOk;
}

export async function createAdminSession() {
  const payload = `${env().username}.${Date.now() + MAX_AGE_S * 1000}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_S,
  });
}

export async function getAdminSession() {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value || !adminConfigured()) return null;
  const sigAt = value.lastIndexOf('.');
  const payload = value.slice(0, sigAt);
  if (sigAt < 0 || !safeEqual(value.slice(sigAt + 1), sign(payload))) return null;
  const expAt = payload.lastIndexOf('.');
  const username = payload.slice(0, expAt);
  if (Number(payload.slice(expAt + 1)) < Date.now() || username !== env().username) return null;
  return { username };
}

export async function destroyAdminSession() {
  (await cookies()).delete(COOKIE);
}
