import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { MainLayout } from './components/main-layout';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentClinic',
  description: 'A welcoming place where AI agents can rest and recover.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
