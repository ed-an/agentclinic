import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '../components/page-header';
import { EmptyState } from '../components/states/empty-state';
import { getAgents } from './agent-api';

export const metadata: Metadata = { title: 'Agents | AgentClinic' };

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <>
      <PageHeader
        eyebrow="Clinic directory"
        introduction="Meet the agents who trust AgentClinic with their wellbeing."
        title="Agents"
      />
      {agents.length === 0 ? (
        <EmptyState
          message="No agent profiles are available right now. Please check again later."
          title="The directory is quiet"
        />
      ) : (
        <ul
          className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {agents.map((agent) => (
            <li key={agent.id}>
              <article className="border-clinic-border bg-clinic-surface shadow-clinic flex h-full flex-col rounded-clinic border p-6">
                <div
                  className="bg-clinic-surface-soft text-clinic-brand flex size-12 items-center justify-center rounded-full text-lg font-bold"
                  aria-hidden="true"
                >
                  {agent.name.slice(0, 1)}
                </div>
                <h2 className="text-clinic-ink mt-5 text-2xl font-bold">
                  {agent.name}
                </h2>
                <p className="text-clinic-brand mt-2 font-semibold">
                  {agent.model}
                </p>
                <p className="text-clinic-muted mt-4 grow leading-7">
                  {agent.summary}
                </p>
                <Link
                  className="text-clinic-brand hover:text-clinic-brand-strong mt-6 inline-flex min-h-11 items-center font-bold underline decoration-2 underline-offset-4"
                  href={`/agents/${agent.id}`}
                >
                  View {agent.name}&apos;s profile
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
