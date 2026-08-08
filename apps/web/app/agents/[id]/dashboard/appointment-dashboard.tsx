'use client';

import { useEffect, useRef, useState } from 'react';
import type { AgentAppointment } from '../../agent-api';
import { formatSlot } from '../../../therapies/time-zone';
import { EmptyState } from '../../../components/states/empty-state';

type Props = Readonly<{
  agentId: string;
  apiUrl: string;
  initialAppointments: AgentAppointment[];
}>;

export function AppointmentDashboard({
  agentId,
  apiUrl,
  initialAppointments,
}: Props) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error';
    message: string;
  } | null>(null);
  const confirmationHeading = useRef<HTMLHeadingElement>(null);
  const actionRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (confirmingId) confirmationHeading.current?.focus();
  }, [confirmingId]);

  function beginConfirmation(id: string) {
    setFeedback(null);
    setConfirmingId(id);
  }

  function closeConfirmation(id: string) {
    setConfirmingId(null);
    requestAnimationFrame(() => actionRefs.current.get(id)?.focus());
  }

  async function cancel(appointment: AgentAppointment) {
    if (pendingId) return;
    setPendingId(appointment.id);
    setFeedback(null);
    try {
      const response = await fetch(
        `${apiUrl}/agents/${encodeURIComponent(agentId)}/appointments/${encodeURIComponent(appointment.id)}/cancel`,
        { method: 'POST', headers: { accept: 'application/json' } },
      );
      if (response.status === 409) {
        setConfirmingId(null);
        setFeedback({
          kind: 'error',
          message:
            'This appointment is no longer eligible to cancel. Reload the dashboard for its latest state.',
        });
        return;
      }
      if (response.status === 404) {
        setConfirmingId(null);
        setFeedback({
          kind: 'error',
          message:
            'This appointment is no longer available here. Reload the dashboard for its latest state.',
        });
        return;
      }
      if (!response.ok) throw new Error('safe cancellation failure');
      setAppointments((items) =>
        items.filter(({ id }) => id !== appointment.id),
      );
      setConfirmingId(null);
      setFeedback({
        kind: 'success',
        message: `${appointment.therapy.name} was cancelled. Its eligible time is available to book again.`,
      });
      requestAnimationFrame(() =>
        document.getElementById('dashboard-feedback')?.focus(),
      );
    } catch {
      setFeedback({
        kind: 'error',
        message:
          'We could not cancel this appointment safely. Nothing was changed; please retry.',
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section aria-labelledby="upcoming-heading" className="mt-10">
      <h2 id="upcoming-heading" className="text-3xl font-bold">
        Upcoming appointments
      </h2>
      {feedback && (
        <div
          id="dashboard-feedback"
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
              type="button"
              className="ml-2 underline underline-offset-4"
              onClick={() => window.location.reload()}
            >
              Reload dashboard
            </button>
          )}
        </div>
      )}
      {appointments.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            message="There are no future confirmed appointments for this Agent."
            title="No upcoming appointments"
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
            const deadline = formatSlot(
              {
                id: `${appointment.id}-deadline`,
                therapyId: appointment.therapy.id,
                startsAt: appointment.cancellationDeadline,
                endsAt: appointment.cancellationDeadline,
                durationMinutes: 0,
              },
              appointment.displayTimeZone,
            );
            return (
              <li key={appointment.id}>
                <article className="border-clinic-border bg-clinic-surface rounded-clinic border p-5 shadow-clinic sm:p-6">
                  <h3 className="text-2xl font-bold">
                    {appointment.therapy.name}
                  </h3>
                  <p className="text-clinic-muted mt-2">
                    <time dateTime={appointment.startsAt}>
                      {formatted.dateLabel}, {formatted.timeLabel}
                    </time>{' '}
                    · {formatted.durationLabel} · {formatted.timeZoneLabel}
                  </p>
                  <p className="text-clinic-muted mt-2 text-sm">
                    Reference: {appointment.id}
                  </p>
                  <p className="mt-4 font-semibold">
                    {appointment.cancellationEligible
                      ? `Cancel by ${deadline.dateLabel}, ${deadline.timeLabel.split('–')[0]} ${deadline.timeZoneLabel}.`
                      : 'The cancellation deadline has passed.'}
                  </p>
                  {appointment.cancellationEligible &&
                    (confirmingId === appointment.id ? (
                      <section
                        className="border-clinic-border mt-5 rounded-lg border p-4"
                        aria-labelledby={`confirm-${appointment.id}`}
                      >
                        <h4
                          id={`confirm-${appointment.id}`}
                          ref={confirmationHeading}
                          tabIndex={-1}
                          className="text-lg font-bold"
                        >
                          Cancel {appointment.therapy.name}?
                        </h4>
                        <p className="text-clinic-muted mt-2">
                          This cancels the appointment on {formatted.dateLabel}{' '}
                          at {formatted.timeLabel.split('–')[0]}.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            disabled={pendingId === appointment.id}
                            className="border-clinic-border min-h-11 rounded-lg border px-4 font-bold disabled:opacity-60"
                            onClick={() => closeConfirmation(appointment.id)}
                          >
                            Keep appointment
                          </button>
                          <button
                            type="button"
                            disabled={pendingId === appointment.id}
                            className="bg-clinic-danger min-h-11 rounded-lg px-4 font-bold text-white disabled:opacity-60"
                            onClick={() => void cancel(appointment)}
                          >
                            {pendingId === appointment.id
                              ? 'Cancelling…'
                              : 'Confirm cancellation'}
                          </button>
                        </div>
                      </section>
                    ) : (
                      <button
                        ref={(node) => {
                          if (node)
                            actionRefs.current.set(appointment.id, node);
                        }}
                        type="button"
                        className="border-clinic-danger text-clinic-danger mt-5 min-h-11 rounded-lg border px-4 font-bold"
                        onClick={() => beginConfirmation(appointment.id)}
                      >
                        Cancel appointment
                      </button>
                    ))}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
