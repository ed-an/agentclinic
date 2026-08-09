'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useRef, useState } from 'react';

export function SignInForm({
  apiUrl,
  returnTo,
}: {
  apiUrl: string;
  returnTo: string | null;
}) {
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${apiUrl}/auth/sign-in`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          email: data.get('email'),
          password: data.get('password'),
          ...(returnTo ? { returnTo } : {}),
        }),
      });
      if (response.status === 401)
        throw new Error('Email or password is incorrect.');
      if (response.status === 429)
        throw new Error(
          'Too many attempts. Pause for 15 minutes, then try again.',
        );
      if (!response.ok)
        throw new Error('We could not sign you in safely. Please retry.');
      const session = (await response.json()) as {
        role: 'AGENT' | 'STAFF';
        returnTo: string | null;
      };
      router.push(
        session.returnTo ??
          (session.role === 'AGENT'
            ? '/agent/dashboard'
            : '/staff/appointments'),
      );
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'We could not sign you in safely. Please retry.',
      );
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setPending(false);
    }
  }
  return (
    <form
      className="border-clinic-border mt-8 grid max-w-xl gap-5 rounded-clinic border p-5 sm:p-6"
      onSubmit={submit}
    >
      {error && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="border-clinic-danger text-clinic-danger rounded-lg border p-4 font-bold"
        >
          {error}
        </div>
      )}
      <div>
        <label className="block font-bold" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="username"
          className="border-clinic-border mt-2 min-h-11 w-full rounded-lg border p-3"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>
      <div>
        <label className="block font-bold" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="border-clinic-border mt-2 min-h-11 w-full rounded-lg border p-3"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>
      <button
        className="bg-clinic-brand min-h-11 rounded-lg px-5 font-bold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
