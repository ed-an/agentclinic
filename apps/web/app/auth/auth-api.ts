import { cookies } from 'next/headers';
import type { Session } from './auth-types';
export type { Session } from './auth-types';

export const apiUrl =
  process.env.AGENTCLINIC_API_URL ?? 'http://127.0.0.1:3001';

export async function requestWithSession(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const cookieStore = await cookies();
  return fetch(`${apiUrl}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      cookie: cookieStore.toString(),
      ...init.headers,
    },
  });
}

export async function getSession(): Promise<Session | null> {
  const response = await requestWithSession('/auth/session');
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Unable to check the current session');
  return (await response.json()) as Session;
}

export function signInPath(returnTo: string): string {
  return `/sign-in?returnTo=${encodeURIComponent(returnTo)}`;
}
