'use client';

import { useEffect, useRef, useState } from 'react';
import { formatInstant, formatSlot } from '../../therapies/time-zone';
import { EmptyState } from '../../components/states/empty-state';
import type { StaffAppointment } from './staff-appointment-api';

const reasons = [
  ['STAFF_UNAVAILABLE', 'Staff unavailable'],
  ['SCHEDULE_CHANGE', 'Schedule change'],
  ['DUPLICATE_BOOKING', 'Duplicate booking'],
  ['OTHER_OPERATIONAL', 'Other operational reason'],
] as const;

type Props = Readonly<{
  initialAppointments: StaffAppointment[];
  apiUrl: string;
  filtered: boolean;
  visibleStatuses: string[];
  csrfToken?: string;
}>;

export function AppointmentQueue({
  initialAppointments,
  apiUrl,
  filtered,
  visibleStatuses,
  csrfToken = '',
}: Props) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [action, setAction] = useState<{
    id: string;
    kind: 'confirm' | 'cancel';
  } | null>(null);
  const [reasonCode, setReasonCode] = useState('');
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);
  const actionHeading = useRef<HTMLHeadingElement>(null);
  const actionButtons = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (action) actionHeading.current?.focus();
  }, [action]);

  function closeAction() {
    const key = action ? `${action.kind}-${action.id}` : '';
    setAction(null);
    setReasonCode('');
    requestAnimationFrame(() => actionButtons.current.get(key)?.focus());
  }

  async function submit(appointment: StaffAppointment) {
    if (!action || pending || (action.kind === 'cancel' && !reasonCode)) return;
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetch(
        `${apiUrl}/staff/appointments/${encodeURIComponent(appointment.id)}/${action.kind}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            accept: 'application/json',
            'x-agentclinic-csrf': csrfToken,
            ...(action.kind === 'cancel'
              ? { 'content-type': 'application/json' }
              : {}),
          },
          ...(action.kind === 'cancel'
            ? { body: JSON.stringify({ reasonCode }) }
            : {}),
        },
      );
      if (response.status === 409) {
        setAction(null);
        setFeedback({
          kind: 'error',
          message:
            'This appointment changed or is no longer eligible. Reload the queue for its latest state.',
        });
        return;
      }
      if (response.status === 404) {
        setAction(null);
        setFeedback({
          kind: 'error',
          message:
            'This appointment was not found. Reload the queue for its latest state.',
        });
        return;
      }
      if (!response.ok) throw new Error('safe staff action failure');
      const updated = (await response.json()) as StaffAppointment;
      const staysVisible =
        visibleStatuses.length === 0
          ? updated.status !== 'CANCELLED'
          : visibleStatuses.includes(updated.status);
      setAppointments((items) =>
        staysVisible
          ? items.map((item) => (item.id === updated.id ? updated : item))
          : items.filter((item) => item.id !== updated.id),
      );
      setAction(null);
      setReasonCode('');
      setFeedback({
        kind: 'success',
        message: `${updated.therapy.name} is now ${updated.status.toLowerCase()}.`,
      });
      requestAnimationFrame(() =>
        document.getElementById('staff-queue-feedback')?.focus(),
      );
    } catch {
      setFeedback({
        kind: 'error',
        message:
          'We could not update this appointment safely. Nothing was changed; please retry.',
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="queue-heading" className="mt-10">
      <h2 id="queue-heading" className="text-3xl font-bold">
        Appointment queue
      </h2>
      {feedback && (
        <div
          id="staff-queue-feedback"
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          tabIndex={-1}
          className={`mt-5 rounded-lg border p-4 font-bold ${
            feedback.kind === 'error'
              ? 'border-clinic-danger text-clinic-danger'
              : 'border-clinic-brand text-clinic-brand'
          }`}
        >
          {feedback.message}{' '}
          {feedback.kind === 'error' && (
            <button
              className="underline underline-offset-4"
              type="button"
              onClick={() => window.location.reload()}
            >
              Reload queue
            </button>
          )}
        </div>
      )}
      {appointments.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={filtered ? 'No matching appointments' : 'Queue is clear'}
            message={
              filtered
                ? 'No appointments match these filters. Clear filters to return to the upcoming queue.'
                : 'There are no upcoming pending or confirmed appointments.'
            }
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-5" role="list">
          {appointments.map((appointment) => {
            const formatted = formatSlot(
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
              <li key={appointment.id}>
                <article className="border-clinic-border bg-clinic-surface rounded-clinic border p-5 shadow-clinic sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl font-bold">
                        {appointment.therapy.name}
                      </h3>
                      <p className="text-clinic-muted mt-1">
                        Agent: {appointment.agent.name}
                      </p>
                    </div>
                    <span className="bg-clinic-surface-soft rounded-full px-3 py-1 text-sm font-bold">
                      {appointment.status}
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-bold">Time</dt>
                      <dd>
                        <time dateTime={appointment.startsAt}>
                          {formatted.dateLabel}, {formatted.timeLabel}
                        </time>{' '}
                        · {formatted.durationLabel} · {formatted.timeZoneLabel}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold">Reference</dt>
                      <dd className="break-all">{appointment.id}</dd>
                    </div>
                    <div>
                      <dt className="font-bold">Created</dt>
                      <dd>
                        <time dateTime={appointment.createdAt}>
                          {formatInstant(
                            appointment.createdAt,
                            appointment.displayTimeZone,
                          )}
                        </time>
                      </dd>
                    </div>
                    <div>
                      <dt className="font-bold">Last status change</dt>
                      <dd>
                        <time dateTime={appointment.lastStatusChangedAt}>
                          {formatInstant(
                            appointment.lastStatusChangedAt,
                            appointment.displayTimeZone,
                          )}
                        </time>
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {appointment.confirmationAllowed && (
                      <button
                        ref={(node) => {
                          if (node)
                            actionButtons.current.set(
                              `confirm-${appointment.id}`,
                              node,
                            );
                        }}
                        type="button"
                        className="bg-clinic-brand min-h-11 rounded-lg px-4 font-bold text-white"
                        onClick={() =>
                          setAction({ id: appointment.id, kind: 'confirm' })
                        }
                      >
                        Confirm appointment
                      </button>
                    )}
                    {appointment.cancellationAllowed && (
                      <button
                        ref={(node) => {
                          if (node)
                            actionButtons.current.set(
                              `cancel-${appointment.id}`,
                              node,
                            );
                        }}
                        type="button"
                        className="border-clinic-danger text-clinic-danger min-h-11 rounded-lg border px-4 font-bold"
                        onClick={() =>
                          setAction({ id: appointment.id, kind: 'cancel' })
                        }
                      >
                        Cancel appointment
                      </button>
                    )}
                  </div>
                  {action?.id === appointment.id && (
                    <section
                      className="border-clinic-border mt-5 rounded-lg border p-4"
                      aria-labelledby={`staff-action-${appointment.id}`}
                    >
                      <h4
                        id={`staff-action-${appointment.id}`}
                        ref={actionHeading}
                        tabIndex={-1}
                        className="text-lg font-bold"
                      >
                        {action.kind === 'confirm' ? 'Confirm' : 'Cancel'}{' '}
                        {appointment.therapy.name}?
                      </h4>
                      <p className="text-clinic-muted mt-2">
                        {formatted.dateLabel} at{' '}
                        {formatted.timeLabel.split('–')[0]} for{' '}
                        {appointment.agent.name}.
                      </p>
                      {action.kind === 'cancel' && (
                        <div className="mt-4">
                          <label
                            className="block font-bold"
                            htmlFor={`reason-${appointment.id}`}
                          >
                            Cancellation reason
                          </label>
                          <select
                            id={`reason-${appointment.id}`}
                            className="border-clinic-border mt-2 min-h-11 w-full rounded-lg border p-3"
                            value={reasonCode}
                            onChange={(event) =>
                              setReasonCode(event.target.value)
                            }
                          >
                            <option value="">Choose a reason</option>
                            {reasons.map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={pending}
                          className="border-clinic-border min-h-11 rounded-lg border px-4 font-bold disabled:opacity-60"
                          onClick={closeAction}
                        >
                          Go back
                        </button>
                        <button
                          type="button"
                          disabled={
                            pending || (action.kind === 'cancel' && !reasonCode)
                          }
                          className="bg-clinic-brand min-h-11 rounded-lg px-4 font-bold text-white disabled:opacity-60"
                          onClick={() => void submit(appointment)}
                        >
                          {pending
                            ? 'Updating…'
                            : action.kind === 'confirm'
                              ? 'Confirm request'
                              : 'Confirm cancellation'}
                        </button>
                      </div>
                    </section>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
