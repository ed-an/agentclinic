'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Session } from '../auth/auth-types';
import { SignOutButton } from '../auth/sign-out-button';

export const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/agents', label: 'Agents' },
  { href: '/ailments', label: 'Ailments' },
  { href: '/therapies', label: 'Therapies' },
  { href: '/appointments', label: 'Appointments' },
] as const;

export function Navigation({
  apiUrl,
  session,
}: {
  apiUrl: string;
  session: Session | null;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary">
      <ul className="flex flex-wrap gap-2" role="list">
        {navigationItems.map(({ href, label }) => {
          const isCurrent =
            pathname === href ||
            (href !== '/' && pathname.startsWith(`${href}/`));

          return (
            <li key={href}>
              <Link
                aria-current={isCurrent ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isCurrent
                    ? 'bg-clinic-brand text-white'
                    : 'text-clinic-ink hover:bg-clinic-surface-soft'
                }`}
                href={href}
              >
                {label}
              </Link>
            </li>
          );
        })}
        {session?.role === 'AGENT' && (
          <li>
            <Link
              className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold"
              href="/agent/dashboard"
            >
              My dashboard
            </Link>
          </li>
        )}
        {session?.role === 'STAFF' && (
          <li>
            <Link
              className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold"
              href="/staff/appointments"
            >
              Staff appointments
            </Link>
          </li>
        )}
        {session ? (
          <li>
            <SignOutButton apiUrl={apiUrl} csrfToken={session.csrfToken} />
          </li>
        ) : (
          <li>
            <Link
              className="inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold"
              href="/sign-in"
            >
              Sign in
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
