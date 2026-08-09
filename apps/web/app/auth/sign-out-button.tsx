'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SignOutButton({
  apiUrl,
  csrfToken,
}: {
  apiUrl: string;
  csrfToken: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function signOut() {
    if (pending) return;
    setPending(true);
    try {
      await fetch(`${apiUrl}/auth/sign-out`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-agentclinic-csrf': csrfToken },
      });
    } finally {
      router.push('/sign-in?signedOut=true');
      router.refresh();
    }
  }
  return (
    <button
      className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold"
      disabled={pending}
      onClick={() => void signOut()}
      type="button"
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
