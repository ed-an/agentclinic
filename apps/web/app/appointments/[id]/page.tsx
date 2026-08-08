import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiStatusError, getAppointment } from '../appointment-api';
import { formatSlot } from '../../therapies/time-zone';

export default async function ConfirmationPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  let appointment;
  try {
    appointment = await getAppointment(id);
  } catch (error) {
    if (
      error instanceof ApiStatusError &&
      (error.status === 400 || error.status === 404)
    )
      notFound();
    throw error;
  }
  const time = formatSlot(
    {
      id: appointment.id,
      therapyId: appointment.therapy.id,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      durationMinutes: appointment.durationMinutes,
    },
    appointment.displayTimeZone,
  );
  return (
    <article className="border-clinic-border bg-clinic-surface max-w-2xl rounded-clinic border p-6 sm:p-10">
      <p className="text-clinic-brand font-bold uppercase tracking-widest">
        Request received
      </p>
      <h1 className="mt-3 text-4xl font-bold">
        Your appointment request is pending
      </h1>
      <p className="text-clinic-muted mt-4 leading-7">
        Clinic staff will review this request before it is confirmed. This time
        is reserved while the request is pending.
      </p>
      <dl className="mt-8 grid gap-5">
        <div>
          <dt className="font-bold">Therapy</dt>
          <dd>{appointment.therapy.name}</dd>
        </div>
        <div>
          <dt className="font-bold">Agent</dt>
          <dd>{appointment.agent.name}</dd>
        </div>
        <div>
          <dt className="font-bold">Date and time</dt>
          <dd>
            <time dateTime={appointment.startsAt}>
              {time.dateLabel}, {time.timeLabel}
            </time>{' '}
            · {time.durationLabel} · {time.timeZoneLabel}
          </dd>
        </div>
        <div>
          <dt className="font-bold">Status</dt>
          <dd>{appointment.status}</dd>
        </div>
        <div>
          <dt className="font-bold">Reference</dt>
          <dd className="break-all">{appointment.id}</dd>
        </div>
      </dl>
      <Link
        className="text-clinic-brand mt-8 inline-flex min-h-11 items-center font-bold underline"
        href={`/therapies/${appointment.therapy.id}`}
      >
        Back to therapy details
      </Link>
    </article>
  );
}
