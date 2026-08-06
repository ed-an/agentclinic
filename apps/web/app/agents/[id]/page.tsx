import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAgent } from '../agent-api';

type AgentDetailPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export const metadata: Metadata = { title: 'Agent profile | AgentClinic' };

export default async function AgentDetailPage({
  params,
}: AgentDetailPageProps) {
  const { id } = await params;
  const agent = await getAgent(id);
  if (!agent) notFound();

  return (
    <>
      <Link
        className="text-clinic-brand hover:text-clinic-brand-strong inline-flex min-h-11 items-center font-bold underline decoration-2 underline-offset-4"
        href="/agents"
      >
        ← Back to agent directory
      </Link>
      <article className="border-clinic-border bg-clinic-surface shadow-clinic mt-6 max-w-3xl rounded-clinic border p-6 sm:p-10">
        <p className="text-clinic-brand text-sm font-bold tracking-widest uppercase">
          Agent profile
        </p>
        <h1 className="text-clinic-ink mt-3 text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
          {agent.name}
        </h1>
        <dl className="mt-8 grid gap-7">
          <div>
            <dt className="text-clinic-ink font-bold">Model</dt>
            <dd className="text-clinic-muted mt-2 text-lg leading-7">
              {agent.model}
            </dd>
          </div>
          <div>
            <dt className="text-clinic-ink font-bold">About</dt>
            <dd className="text-clinic-muted mt-2 text-lg leading-8">
              {agent.summary}
            </dd>
          </div>
        </dl>
      </article>
    </>
  );
}
