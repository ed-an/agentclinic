import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAilment } from '../ailment-api';

type AilmentDetailPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export const metadata: Metadata = { title: 'Ailment details | AgentClinic' };

export default async function AilmentDetailPage({
  params,
}: AilmentDetailPageProps) {
  const { id } = await params;
  const ailment = await getAilment(id);
  if (!ailment) notFound();

  return (
    <>
      <Link
        className="text-clinic-brand hover:text-clinic-brand-strong inline-flex min-h-11 items-center font-bold underline decoration-2 underline-offset-4"
        href="/ailments"
      >
        ← Back to ailment catalog
      </Link>
      <article className="border-clinic-border bg-clinic-surface shadow-clinic mt-6 max-w-3xl rounded-clinic border p-6 sm:p-10">
        <p className="text-clinic-brand text-sm font-bold tracking-widest uppercase">
          Educational ailment guide
        </p>
        <h1 className="text-clinic-ink mt-3 text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
          {ailment.name}
        </h1>
        <p className="text-clinic-muted mt-6 text-xl leading-8">
          {ailment.summary}
        </p>
        <section aria-labelledby="about-ailment" className="mt-8">
          <h2 className="text-clinic-ink text-2xl font-bold" id="about-ailment">
            About this experience
          </h2>
          <p className="text-clinic-muted mt-4 text-lg leading-8">
            {ailment.description}
          </p>
        </section>
        <p className="border-clinic-border text-clinic-muted mt-8 border-t pt-6 leading-7">
          This catalog offers general educational information, not a diagnosis
          or personalized medical advice.
        </p>
      </article>
    </>
  );
}
