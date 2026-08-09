import type { Metadata } from 'next';
import { PageHeader } from '../../components/page-header';
import { getAgents } from '../../agents/agent-api';
import { getTherapies } from '../../therapies/therapy-api';
import { AppointmentQueue } from './appointment-queue';
import {
  getStaffAppointments,
  getStaffAppointmentsApiUrl,
} from './staff-appointment-api';
import { getSession, signInPath } from '../../auth/auth-api';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Staff appointment queue | AgentClinic',
};

type SearchValue = string | string[] | undefined;
type Props = Readonly<{
  searchParams: Promise<Record<string, SearchValue>>;
}>;

export default async function StaffAppointmentsPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect(signInPath('/staff/appointments'));
  if (session.role !== 'STAFF') redirect('/forbidden');
  const input = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) query.append(key, item);
    }
  }
  const [appointments, agents, therapies] = await Promise.all([
    getStaffAppointments(query),
    getAgents(),
    getTherapies(),
  ]);
  const statuses = query.getAll('status').flatMap((value) => value.split(','));
  const filtered = [...query.values()].some((value) => value !== '');

  return (
    <>
      <PageHeader
        eyebrow="Clinic operations"
        title="Staff appointment queue"
        introduction="Review pending requests and keep each appointment status clear."
      />
      <form
        className="border-clinic-border mt-8 grid gap-5 rounded-clinic border p-5 lg:grid-cols-2"
        method="get"
      >
        <fieldset>
          <legend className="font-bold">Status</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {['PENDING', 'CONFIRMED', 'CANCELLED'].map((status) => (
              <label
                key={status}
                className="inline-flex min-h-11 items-center gap-2"
              >
                <input
                  type="checkbox"
                  name="status"
                  value={status}
                  defaultChecked={statuses.includes(status)}
                />
                {status}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="block font-bold" htmlFor="agentId">
            Agent
          </label>
          <select
            className="border-clinic-border mt-2 min-h-11 w-full rounded-lg border p-3"
            id="agentId"
            name="agentId"
            defaultValue={query.get('agentId') ?? ''}
          >
            <option value="">All Agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-bold" htmlFor="therapyId">
            Therapy
          </label>
          <select
            className="border-clinic-border mt-2 min-h-11 w-full rounded-lg border p-3"
            id="therapyId"
            name="therapyId"
            defaultValue={query.get('therapyId') ?? ''}
          >
            <option value="">All therapies</option>
            {therapies.map((therapy) => (
              <option key={therapy.id} value={therapy.id}>
                {therapy.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-bold" htmlFor="from">
              From (inclusive)
            </label>
            <input
              className="border-clinic-border mt-2 min-h-11 w-full rounded-lg border p-3"
              id="from"
              name="from"
              placeholder="2035-06-01T12:00:00Z"
              defaultValue={query.get('from') ?? ''}
            />
          </div>
          <div>
            <label className="block font-bold" htmlFor="to">
              To (exclusive)
            </label>
            <input
              className="border-clinic-border mt-2 min-h-11 w-full rounded-lg border p-3"
              id="to"
              name="to"
              placeholder="2035-07-01T12:00:00Z"
              defaultValue={query.get('to') ?? ''}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3 lg:col-span-2">
          <button
            className="bg-clinic-brand min-h-11 rounded-lg px-5 font-bold text-white"
            type="submit"
          >
            Apply filters
          </button>
          <a
            className="border-clinic-border inline-flex min-h-11 items-center rounded-lg border px-5 font-bold"
            href="/staff/appointments"
          >
            Clear filters
          </a>
        </div>
      </form>
      <AppointmentQueue
        initialAppointments={appointments}
        apiUrl={getStaffAppointmentsApiUrl()}
        filtered={filtered}
        visibleStatuses={statuses}
        csrfToken={session.csrfToken}
      />
    </>
  );
}
