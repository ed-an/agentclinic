import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '../../../components/page-header';
import {
  getAgent,
  getAgentAppointmentsApiUrl,
  getUpcomingAppointments,
} from '../../agent-api';
import { AppointmentDashboard } from './appointment-dashboard';

type Props = Readonly<{ params: Promise<{ id: string }> }>;

export const metadata: Metadata = { title: 'Agent dashboard | AgentClinic' };

export default async function AgentDashboardPage({ params }: Props) {
  const { id } = await params;
  const [agent, appointments] = await Promise.all([
    getAgent(id),
    getUpcomingAppointments(id),
  ]);
  if (!agent || !appointments) notFound();

  return (
    <>
      <Link
        className="text-clinic-brand hover:text-clinic-brand-strong inline-flex min-h-11 items-center font-bold underline decoration-2 underline-offset-4"
        href="/agents"
      >
        ← Choose another Agent
      </Link>
      <PageHeader
        eyebrow="Upcoming care"
        introduction={`Review ${agent.name}'s confirmed appointments and cancel eligible visits.`}
        title={`${agent.name}'s dashboard`}
      />
      <aside className="border-clinic-border bg-clinic-surface-soft mt-6 max-w-3xl rounded-clinic border p-5 leading-7">
        <p className="font-bold">Temporary demonstration selection</p>
        <p className="text-clinic-muted mt-1">
          Selecting an Agent from the directory is for this demonstration only.
          It is not authentication or authorization and is not
          production-secure.
        </p>
      </aside>
      <AppointmentDashboard
        agentId={agent.id}
        apiUrl={getAgentAppointmentsApiUrl()}
        initialAppointments={appointments}
      />
    </>
  );
}
