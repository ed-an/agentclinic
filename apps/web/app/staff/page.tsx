import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '../components/page-header';
import { getSession, signInPath } from '../auth/auth-api';

export const metadata: Metadata = { title: 'Staff | AgentClinic' };

export default async function StaffPage() {
  const session = await getSession();
  if (!session) redirect(signInPath('/staff'));
  if (session.role !== 'STAFF') redirect('/forbidden');
  return (
    <>
      <PageHeader
        eyebrow="Clinic operations"
        introduction="Review pending care requests and keep appointment status clear."
        title="Staff"
      />
      <Link
        className="bg-clinic-brand mt-8 inline-flex min-h-11 items-center rounded-lg px-5 font-bold text-white"
        href="/staff/appointments"
      >
        Open appointment queue
      </Link>
    </>
  );
}
