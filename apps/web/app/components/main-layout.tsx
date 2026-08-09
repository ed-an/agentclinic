import type { ReactNode } from 'react';
import { Footer } from './footer';
import { Header } from './header';
import { Main } from './main';
import type { Session } from '../auth/auth-types';

type MainLayoutProps = Readonly<{
  children: ReactNode;
  session?: Session | null;
}>;

export function MainLayout({ children, session = null }: MainLayoutProps) {
  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto]">
      <a
        className="bg-clinic-brand fixed top-3 left-3 z-50 -translate-y-24 rounded-md px-4 py-3 font-semibold text-white transition-transform focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>
      <Header session={session} />
      <Main>{children}</Main>
      <Footer />
    </div>
  );
}
