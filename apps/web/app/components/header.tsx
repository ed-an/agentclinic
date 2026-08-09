import Link from 'next/link';
import { Navigation } from './navigation';
import { apiUrl } from '../auth/auth-api';
import type { Session } from '../auth/auth-types';

export function Header({ session }: { session: Session | null }) {
  return (
    <header className="border-clinic-border bg-clinic-surface border-b">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-8 md:flex-row md:items-center md:justify-between">
        <Link
          className="text-clinic-brand-strong w-fit text-xl font-bold tracking-tight"
          href="/"
        >
          AgentClinic
        </Link>
        <Navigation apiUrl={apiUrl} session={session} />
      </div>
    </header>
  );
}
