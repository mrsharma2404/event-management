'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { login } from './actions';

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="space-y-1">
      {state.error && <p role="alert" className="mb-4 rounded-lg bg-danger/10 px-3 py-2.5 text-sm text-danger">{state.error}</p>}
      <Field label="Username" htmlFor="admin-user">
        <Input id="admin-user" name="username" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Password" htmlFor="admin-pass">
        <Input id="admin-pass" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" block loading={pending} className="!mt-5">Sign in</Button>
    </form>
  );
}
