import type { ReactNode } from 'react';

type MainProps = Readonly<{
  children: ReactNode;
}>;

export function Main({ children }: MainProps) {
  return <main className="site-main">{children}</main>;
}
