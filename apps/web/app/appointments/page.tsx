import type { Metadata } from 'next';
import Link from 'next/link';
import { getSession, signInPath } from '../auth/auth-api';
import { PageHeader } from '../components/page-header';

export const metadata: Metadata = { title: 'Appointments | AgentClinic' };

const actionClass =
  'bg-clinic-brand inline-flex min-h-11 items-center rounded-lg px-5 font-bold text-white';
const secondaryActionClass =
  'text-clinic-brand inline-flex min-h-11 items-center font-bold underline';

export default async function AppointmentsPage() {
  let session: Awaited<ReturnType<typeof getSession>> = null;
  let sessionUnavailable = false;
  try {
    session = await getSession();
  } catch {
    sessionUnavailable = true;
  }

  return (
    <>
      <PageHeader
        eyebrow="Find and manage care"
        introduction="Choose a therapy and an available time to request care, or open the appointment view available for your account."
        title="Appointments"
      />

      <div className="mt-8 grid max-w-4xl gap-6 md:grid-cols-2">
        <section className="border-clinic-border rounded-clinic border p-5 sm:p-6">
          <h2 className="text-clinic-ink text-xl font-bold">
            Book an appointment
          </h2>
          <p className="text-clinic-muted mt-3 leading-7">
            Browse the therapy catalog, open a therapy, and select one of its
            available times to begin your booking.
          </p>
          <Link className={`${actionClass} mt-5`} href="/therapies">
            Browse therapies
          </Link>
        </section>

        <section className="border-clinic-border rounded-clinic border p-5 sm:p-6">
          <h2 className="text-clinic-ink text-xl font-bold">
            {sessionUnavailable
              ? 'Account view unavailable'
              : session?.role === 'AGENT'
                ? 'Your upcoming appointments'
                : session?.role === 'STAFF'
                  ? 'Manage appointment requests'
                  : 'Already have an account?'}
          </h2>
          <p className="text-clinic-muted mt-3 leading-7">
            {sessionUnavailable
              ? 'We could not check your account right now. You can still browse therapies or try signing in again.'
              : session?.role === 'AGENT'
                ? 'Open your dashboard to review confirmed upcoming care and cancel an eligible appointment.'
                : session?.role === 'STAFF'
                  ? 'Open the staff queue to filter, confirm, or cancel appointment requests.'
                  : 'Sign in to reach your Agent dashboard or the Staff appointment queue.'}
          </p>
          <Link
            className={`${secondaryActionClass} mt-5`}
            href={
              session?.role === 'AGENT'
                ? '/agent/dashboard'
                : session?.role === 'STAFF'
                  ? '/staff/appointments'
                  : signInPath('/appointments')
            }
          >
            {sessionUnavailable
              ? 'Try signing in'
              : session?.role === 'AGENT'
                ? 'Open my dashboard'
                : session?.role === 'STAFF'
                  ? 'Open staff queue'
                  : 'Sign in'}
          </Link>
        </section>
      </div>
    </>
  );
}
