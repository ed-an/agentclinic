import Link from 'next/link';
import { Navigation } from './navigation';

export function Header() {
  return (
    <header className="border-clinic-border bg-clinic-surface border-b">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-8 md:flex-row md:items-center md:justify-between">
        <Link
          className="text-clinic-brand-strong w-fit text-xl font-bold tracking-tight"
          href="/"
        >
          AgentClinic
        </Link>
        <Navigation />
      </div>
    </header>
  );
}
