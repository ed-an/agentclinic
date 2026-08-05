import type { ReactNode } from 'react';

type MainProps = Readonly<{
  children: ReactNode;
}>;

export function Main({ children }: MainProps) {
  return (
    <main
      className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 md:py-16"
      id="main-content"
      tabIndex={-1}
    >
      {children}
    </main>
  );
}
