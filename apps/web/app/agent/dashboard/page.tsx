import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession, signInPath } from '../../auth/auth-api';
import { AppointmentDashboard } from '../../agents/[id]/dashboard/appointment-dashboard';
import {
  getAgentAppointmentsApiUrl,
  getUpcomingAppointments,
} from '../../agents/agent-api';
import { PageHeader } from '../../components/page-header';

export const metadata: Metadata = { title: 'My dashboard | AgentClinic' };

export default async function AgentDashboardPage() {
  const session = await getSession();
  if (!session) redirect(signInPath('/agent/dashboard'));
  if (session.role !== 'AGENT' || !session.agent) redirect('/forbidden');
  const appointments = await getUpcomingAppointments();
  return (
    <>
      <PageHeader
        eyebrow="Upcoming care"
        introduction={`Review ${session.agent.name}'s confirmed appointments and cancel eligible visits.`}
        title={`${session.agent.name}'s dashboard`}
      />
      <AppointmentDashboard
        apiUrl={getAgentAppointmentsApiUrl()}
        csrfToken={session.csrfToken}
        initialAppointments={appointments}
      />
    </>
  );
}
