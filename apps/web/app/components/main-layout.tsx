import type { ReactNode } from 'react';
import { Footer } from './footer';
import { Header } from './header';
import { Main } from './main';

type MainLayoutProps = Readonly<{
  children: ReactNode;
}>;

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="site-layout">
      <Header />
      <Main>{children}</Main>
      <Footer />
    </div>
  );
}
