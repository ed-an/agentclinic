'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Agent } from '../../agents/agent-api';
import type { BookingContext } from '../appointment-api';
import { formatSlot } from '../../therapies/time-zone';

type Props = Readonly<{
  context: BookingContext;
  agents: Agent[];
  apiUrl: string;
}>;

export function BookingForm({ context, agents, apiUrl }: Props) {
  const router = useRouter();
  const formatted = formatSlot(
    {
      id: context.slotId,
      therapyId: context.therapy.id,
      startsAt: context.startsAt,
      endsAt: context.endsAt,
      durationMinutes: context.durationMinutes,
    },
    context.displayTimeZone,
  );
  const [step, setStep] = useState<'details' | 'review'>('details');
  const [agentId, setAgentId] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [key, setKey] = useState(() => crypto.randomUUID());
  const selectedAgent = agents.find((agent) => agent.id === agentId);

  function review(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (
      !selectedAgent ||
      !visitorName.trim() ||
      !/^\S+@\S+\.\S+$/.test(visitorEmail.trim())
    ) {
      setError('Choose an Agent and enter a valid name and email.');
      return;
    }
    setStep('review');
  }

  async function submit() {
    if (pending || !selectedAgent) return;
    setPending(true);
    setError('');
    try {
      const response = await fetch(`${apiUrl}/appointments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'Idempotency-Key': key },
        body: JSON.stringify({
          availabilitySlotId: context.slotId,
          agentId,
          visitorName,
          visitorEmail,
        }),
      });
      if (response.status === 409) {
        setError(
          'This time was just booked or the request changed. Choose another available time.',
        );
        setKey(crypto.randomUUID());
        return;
      }
      if (!response.ok) {
        setError(
          response.status === 400
            ? 'Please correct the booking details and try again.'
            : 'We could not complete your booking safely. Please retry.',
        );
        return;
      }
      const confirmation = (await response.json()) as { id: string };
      router.push(`/appointments/${confirmation.id}`);
    } catch {
      setError('We could not reach the booking service. Please retry.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-8 max-w-2xl">
      <section
        aria-labelledby="selected-time"
        className="border-clinic-border bg-clinic-surface rounded-clinic border p-6"
      >
        <h2 id="selected-time" className="text-2xl font-bold">
          Selected therapy and time
        </h2>
        <p className="mt-3 text-lg font-bold">{context.therapy.name}</p>
        <p className="text-clinic-muted mt-1">
          <time dateTime={context.startsAt}>
            {formatted.dateLabel}, {formatted.timeLabel}
          </time>{' '}
          · {formatted.durationLabel} · {formatted.timeZoneLabel}
        </p>
      </section>
      {error && (
        <p role="alert" className="text-clinic-danger mt-5 font-bold">
          {error}
        </p>
      )}
      {step === 'details' ? (
        <form className="mt-6 space-y-5" onSubmit={review} noValidate>
          <div>
            <label className="block font-bold" htmlFor="agent">
              Agent
            </label>
            <select
              className="border-clinic-border mt-2 min-h-11 w-full rounded-lg border p-3"
              id="agent"
              required
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            >
              <option value="">Choose an Agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} — {agent.model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold" htmlFor="visitor-name">
              Your name
            </label>
            <input
              className="border-clinic-border mt-2 min-h-11 w-full rounded-lg border p-3"
              id="visitor-name"
              maxLength={100}
              required
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-bold" htmlFor="visitor-email">
              Your email
            </label>
            <input
              className="border-clinic-border mt-2 min-h-11 w-full rounded-lg border p-3"
              id="visitor-email"
              type="email"
              maxLength={254}
              required
              aria-describedby="email-help"
              value={visitorEmail}
              onChange={(e) => setVisitorEmail(e.target.value)}
            />
            <p className="text-clinic-muted mt-1 text-sm" id="email-help">
              Used only to record this booking; it will not appear on
              confirmation.
            </p>
          </div>
          <button
            className="bg-clinic-brand hover:bg-clinic-brand-strong min-h-11 rounded-lg px-5 py-3 font-bold text-white"
            type="submit"
          >
            Review booking
          </button>
        </form>
      ) : (
        <section
          aria-labelledby="review-booking"
          className="border-clinic-border mt-6 rounded-clinic border p-6"
        >
          <h2 id="review-booking" className="text-2xl font-bold">
            Review your booking
          </h2>
          <dl className="mt-4 grid gap-3">
            <div>
              <dt className="font-bold">Therapy</dt>
              <dd>{context.therapy.name}</dd>
            </div>
            <div>
              <dt className="font-bold">Agent</dt>
              <dd>{selectedAgent?.name}</dd>
            </div>
            <div>
              <dt className="font-bold">Time</dt>
              <dd>
                {formatted.dateLabel}, {formatted.timeLabel} ·{' '}
                {formatted.durationLabel} · {formatted.timeZoneLabel}
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="border-clinic-brand min-h-11 rounded-lg border px-5 font-bold"
              type="button"
              disabled={pending}
              onClick={() => setStep('details')}
            >
              Edit details
            </button>
            <button
              className="bg-clinic-brand min-h-11 rounded-lg px-5 font-bold text-white disabled:opacity-60"
              type="button"
              disabled={pending}
              onClick={submit}
            >
              {pending ? 'Booking…' : 'Confirm booking'}
            </button>
          </div>
        </section>
      )}
      <p className="text-clinic-muted mt-8 leading-7">
        Booking is not a diagnosis or guarantee of treatment. For urgent or
        emergency needs, contact the appropriate local emergency services.
      </p>
    </div>
  );
}
