import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTherapy } from '../therapy-api';

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
        <p className="border-clinic-border text-clinic-muted mt-8 border-t pt-6 leading-7">
          These links provide general educational context. They are not a
          diagnosis, prescription, guaranteed treatment, or personalized advice.
        </p>
      </article>
    </>
  );
}
