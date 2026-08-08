import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '../components/page-header';

export const metadata: Metadata = { title: 'Staff | AgentClinic' };

export default function StaffPage() {
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
