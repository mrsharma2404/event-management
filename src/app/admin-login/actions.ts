'use server';

import { redirect } from 'next/navigation';
import { adminConfigured, checkCredentials, createAdminSession, destroyAdminSession } from '@/lib/server/adminAuth';

export async function login(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  if (!adminConfigured()) return { error: 'Admin login is not set up. Add ADMIN_USERNAME and ADMIN_PASSWORD to the environment.' };
  const username = String(form.get('username') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!checkCredentials(username, password)) {
    await new Promise(r => setTimeout(r, 600)); // slow down guessing
    return { error: 'Incorrect username or password' };
  }
  await createAdminSession();
  redirect('/dashboard');
}

export async function logout() {
  await destroyAdminSession();
  redirect('/admin-login');
}
