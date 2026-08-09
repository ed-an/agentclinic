import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { apiUrl, getSession } from '../auth/auth-api';
import { PageHeader } from '../components/page-header';
import { SignInForm } from './sign-in-form';

export const metadata: Metadata = { title: 'Sign in | AgentClinic' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; signedOut?: string }>;
}) {
  const session = await getSession();
  if (session)
    redirect(
      session.role === 'AGENT' ? '/agent/dashboard' : '/staff/appointments',
    );
  const query = await searchParams;
  return (
    <>
      <PageHeader
        eyebrow="Welcome back"
        title="Sign in"
        introduction="Use your AgentClinic demonstration account to continue."
      />
      {query.signedOut === 'true' && (
        <p
          role="status"
          className="border-clinic-brand mt-6 max-w-xl rounded-lg border p-4 font-bold"
        >
          You are signed out.
        </p>
      )}
      <SignInForm apiUrl={apiUrl} returnTo={query.returnTo ?? null} />
    </>
  );
}
