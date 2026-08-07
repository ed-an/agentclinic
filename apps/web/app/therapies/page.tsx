import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '../components/page-header';
import { EmptyState } from '../components/states/empty-state';
import { getTherapies } from './therapy-api';

export const metadata: Metadata = { title: 'Therapies | AgentClinic' };

export default async function TherapiesPage() {
  const therapies = await getTherapies();

  return (
    <>
      <PageHeader
        eyebrow="Care information"
        introduction="Explore gentle, educational therapy information. Associations in this catalog are not a diagnosis, prescription, or promise of a particular outcome."
        title="Therapies"
      />
      {therapies.length === 0 ? (
        <EmptyState
          message="No therapies are listed right now. Please check again later."
          title="The therapy catalog is quiet"
        />
      ) : (
        <section aria-labelledby="therapy-results-heading" className="mt-10">
          <h2
            className="text-clinic-ink text-2xl font-bold"
            id="therapy-results-heading"
          >
            Complete catalog
          </h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2" role="list">
            {therapies.map((therapy) => (
              <li key={therapy.id}>
                <article className="border-clinic-border bg-clinic-surface shadow-clinic flex h-full flex-col rounded-clinic border p-6">
                  <h3 className="text-clinic-ink text-2xl font-bold">
                    {therapy.name}
                  </h3>
                  <p className="text-clinic-muted mt-4 grow leading-7">
                    {therapy.summary}
                  </p>
                  <Link
                    className="text-clinic-brand hover:text-clinic-brand-strong mt-6 inline-flex min-h-11 items-center font-bold underline decoration-2 underline-offset-4"
                    href={`/therapies/${therapy.id}`}
                  >
                    Read about {therapy.name}
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
