export type StaffAppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type StaffAppointment = Readonly<{
  id: string;
  status: StaffAppointmentStatus;
  agent: { id: string; name: string };
  therapy: { id: string; name: string };
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  displayTimeZone: string;
  createdAt: string;
  lastStatusChangedAt: string;
  confirmationAllowed: boolean;
  cancellationAllowed: boolean;
}>;

const apiUrl = process.env.AGENTCLINIC_API_URL ?? 'http://127.0.0.1:3001';
import { requestWithSession } from '../../auth/auth-api';

function isStaffAppointment(value: unknown): value is StaffAppointment {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  const agent = item.agent as Record<string, unknown> | undefined;
  const therapy = item.therapy as Record<string, unknown> | undefined;
  return (
    typeof item.id === 'string' &&
    ['PENDING', 'CONFIRMED', 'CANCELLED'].includes(item.status as string) &&
    typeof agent?.id === 'string' &&
    typeof agent.name === 'string' &&
    typeof therapy?.id === 'string' &&
    typeof therapy.name === 'string' &&
    typeof item.startsAt === 'string' &&
    typeof item.endsAt === 'string' &&
    typeof item.durationMinutes === 'number' &&
    typeof item.displayTimeZone === 'string' &&
    typeof item.createdAt === 'string' &&
    typeof item.lastStatusChangedAt === 'string' &&
    typeof item.confirmationAllowed === 'boolean' &&
    typeof item.cancellationAllowed === 'boolean'
  );
}

export async function getStaffAppointments(
  query: URLSearchParams,
): Promise<StaffAppointment[]> {
  const apiQuery = new URLSearchParams(
    [...query.entries()].filter(([, value]) => value !== ''),
  );
  const response = await requestWithSession(
    `/staff/appointments${apiQuery.size ? `?${apiQuery.toString()}` : ''}`,
  );
  if (!response.ok) throw new Error('Unable to load the staff queue safely');
  const body: unknown = await response.json();
  if (!Array.isArray(body) || !body.every(isStaffAppointment))
    throw new Error('The staff queue returned an invalid response');
  return body;
}

export function getStaffAppointmentsApiUrl(): string {
  return apiUrl;
}
