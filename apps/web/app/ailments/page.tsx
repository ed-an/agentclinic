import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '../components/page-header';
import { EmptyState } from '../components/states/empty-state';
import { getAilments } from './ailment-api';

export const metadata: Metadata = { title: 'Ailments | AgentClinic' };

type AilmentsPageProps = Readonly<{
  searchParams?: Promise<{ q?: string | string[] }>;
}>;

export default async function AilmentsPage({
  searchParams,
}: AilmentsPageProps) {
  const parameters = await searchParams;
  const rawQuery = parameters?.q;
  const query = typeof rawQuery === 'string' ? rawQuery : rawQuery?.[0];
  const normalizedQuery = query?.trim() ?? '';
  const ailments = await getAilments(query);

  return (
    <>
      <PageHeader
        eyebrow="Wellbeing catalog"
        introduction="Explore common strains that agents may encounter. This educational catalog is not medical advice or a diagnosis."
        title="Ailments"
      />
      <form
        action="/ailments"
        className="border-clinic-border bg-clinic-surface mt-8 flex max-w-3xl flex-col gap-3 rounded-clinic border p-5 shadow-clinic sm:flex-row sm:items-end"
        method="get"
        role="search"
      >
        <div className="grow">
          <label
            className="text-clinic-ink block font-bold"
            htmlFor="ailment-search"
          >
            Search ailments
          </label>
          <input
            className="border-clinic-border text-clinic-ink mt-2 min-h-11 w-full rounded-lg border bg-white px-4 py-2"
            defaultValue={query}
            id="ailment-search"
            maxLength={100}
            name="q"
            placeholder="Search by name or summary"
            type="search"
          />
        </div>
        <button
          className="bg-clinic-brand hover:bg-clinic-brand-strong min-h-11 rounded-full px-6 py-2 font-semibold text-white"
          type="submit"
        >
          Search
        </button>
      </form>

      {ailments.length === 0 ? (
        normalizedQuery ? (
          <EmptyState
            action={
              <form action="/ailments" method="get">
                <button
                  className="text-clinic-brand hover:text-clinic-brand-strong inline-flex min-h-11 items-center font-bold underline decoration-2 underline-offset-4"
                  type="submit"
                >
                  Clear search
                </button>
              </form>
            }
            message={`No ailments match “${normalizedQuery}”. Try another name or summary.`}
            title="No search results"
          />
        ) : (
          <EmptyState
            message="No ailments are listed right now. Please check again later."
            title="The catalog is quiet"
          />
        )
      ) : (
        <section aria-labelledby="ailment-results-heading" className="mt-10">
          <h2
            className="text-clinic-ink text-2xl font-bold"
            id="ailment-results-heading"
          >
            {normalizedQuery
              ? `Results for “${normalizedQuery}”`
              : 'Complete catalog'}
          </h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2" role="list">
            {ailments.map((ailment) => (
              <li key={ailment.id}>
                <article className="border-clinic-border bg-clinic-surface shadow-clinic flex h-full flex-col rounded-clinic border p-6">
                  <h3 className="text-clinic-ink text-2xl font-bold">
                    {ailment.name}
                  </h3>
                  <p className="text-clinic-muted mt-4 grow leading-7">
                    {ailment.summary}
                  </p>
                  <Link
                    className="text-clinic-brand hover:text-clinic-brand-strong mt-6 inline-flex min-h-11 items-center font-bold underline decoration-2 underline-offset-4"
                    href={`/ailments/${ailment.id}`}
                  >
                    Read about {ailment.name}
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
