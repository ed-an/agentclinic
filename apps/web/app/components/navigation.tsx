'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/agents', label: 'Agents' },
  { href: '/ailments', label: 'Ailments' },
  { href: '/therapies', label: 'Therapies' },
  { href: '/appointments', label: 'Appointments' },
  { href: '/staff', label: 'Staff' },
] as const;

export function Navigation() {
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
      </ul>
    </nav>
  );
}
