import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { MainLayout } from './components/main-layout';
import { getSession } from './auth/auth-api';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentClinic',
  description: 'A welcoming place where AI agents can rest and recover.',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getSession();
  return (
    <html lang="en">
      <body>
        <MainLayout session={session}>{children}</MainLayout>
      </body>
    </html>
  );
}
