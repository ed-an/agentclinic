import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTherapy, getTherapyAvailability } from '../therapy-api';
import { getDisplayTimeZone, groupAvailabilitySlots } from '../time-zone';

type TherapyDetailPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export const metadata: Metadata = { title: 'Therapy details | AgentClinic' };

export default async function TherapyDetailPage({
  params,
}: TherapyDetailPageProps) {
  const { id } = await params;
  const therapy = await getTherapy(id);
  if (!therapy) notFound();
  const availability = await getTherapyAvailability(id);
  const timeZone = getDisplayTimeZone();
  const availabilityGroups = groupAvailabilitySlots(availability, timeZone);

  return (
    <>
      <Link
        className="text-clinic-brand hover:text-clinic-brand-strong inline-flex min-h-11 items-center font-bold underline decoration-2 underline-offset-4"
        href="/therapies"
      >
        ← Back to therapy catalog
      </Link>
      <article className="border-clinic-border bg-clinic-surface shadow-clinic mt-6 max-w-3xl rounded-clinic border p-6 sm:p-10">
        <p className="text-clinic-brand text-sm font-bold tracking-widest uppercase">
          Educational therapy guide
        </p>
        <h1 className="text-clinic-ink mt-3 text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
          {therapy.name}
        </h1>
        <p className="text-clinic-muted mt-6 text-xl leading-8">
          {therapy.summary}
        </p>
        <section aria-labelledby="about-therapy" className="mt-8">
          <h2 className="text-clinic-ink text-2xl font-bold" id="about-therapy">
            About this therapy
          </h2>
          <p className="text-clinic-muted mt-4 text-lg leading-8">
            {therapy.description}
          </p>
        </section>
        <section aria-labelledby="related-ailments" className="mt-8">
          <h2
            className="text-clinic-ink text-2xl font-bold"
            id="related-ailments"
          >
            Related ailment information
          </h2>
          {therapy.ailments.length === 0 ? (
            <p className="text-clinic-muted mt-4 leading-7">
              This therapy is not linked to an ailment guide yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-2" role="list">
              {therapy.ailments.map((ailment) => (
                <li key={ailment.id}>
                  <Link
                    className="text-clinic-brand hover:text-clinic-brand-strong inline-flex min-h-11 items-center font-bold underline decoration-2 underline-offset-4"
                    href={`/ailments/${ailment.id}`}
                  >
                    {ailment.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="therapy-availability" className="mt-8">
          <h2
            className="text-clinic-ink text-2xl font-bold"
            id="therapy-availability"
          >
            Upcoming availability
          </h2>
          <p className="text-clinic-muted mt-3 leading-7">
            Times are shown in {timeZone}. Availability is informational until
            booking opens in a later phase.
          </p>
          {availabilityGroups.length === 0 ? (
            <p className="text-clinic-muted mt-4 leading-7">
              No available times are listed for this therapy right now. Please
              check again later.
            </p>
          ) : (
            <div className="mt-5 space-y-6">
              {availabilityGroups.map((group) => (
                <section aria-labelledby={`date-${group.key}`} key={group.key}>
                  <h3
                    className="text-clinic-ink text-lg font-bold"
                    id={`date-${group.key}`}
                  >
                    {group.dateLabel}
                  </h3>
                  <ul className="mt-2 space-y-2" role="list">
                    {group.slots.map((slot) => (
                      <li
                        className="border-clinic-border bg-clinic-surface-soft rounded-lg border p-4"
                        key={slot.id}
                      >
                        <p className="text-clinic-ink font-bold">
                          <time dateTime={slot.startsAt}>{slot.timeLabel}</time>
                        </p>
                        <p className="text-clinic-muted mt-1 text-sm">
                          {slot.durationLabel} · {slot.timeZoneLabel}
                        </p>
                        <time className="sr-only" dateTime={slot.endsAt}>
                          Ends at {slot.endsAt}
                        </time>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </section>
        <p className="border-clinic-border text-clinic-muted mt-8 border-t pt-6 leading-7">
          These links provide general educational context. They are not a
          diagnosis, prescription, guaranteed treatment, or personalized advice.
        </p>
      </article>
    </>
  );
}
