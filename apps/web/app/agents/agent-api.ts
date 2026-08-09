export type Agent = Readonly<{
  id: string;
  name: string;
  model: string;
  summary: string;
}>;

export type AgentAppointment = Readonly<{
  id: string;
  status: 'CONFIRMED' | 'CANCELLED';
  therapy: { id: string; name: string };
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  cancellationEligible: boolean;
  cancellationDeadline: string;
  displayTimeZone: string;
}>;

const apiUrl = process.env.AGENTCLINIC_API_URL ?? 'http://127.0.0.1:3001';
import { requestWithSession } from '../auth/auth-api';

function isAgent(value: unknown): value is Agent {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return ['id', 'name', 'model', 'summary'].every(
    (field) => typeof candidate[field] === 'string',
  );
}

async function request(path: string): Promise<Response> {
  return fetch(`${apiUrl}${path}`, {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  });
}

export async function getAgents(): Promise<Agent[]> {
  const response = await request('/agents');
  if (!response.ok) throw new Error('Unable to load the agent directory');

  const body: unknown = await response.json();
  if (!Array.isArray(body) || !body.every(isAgent)) {
    throw new Error('The agent directory returned an invalid response');
  }
  return body;
}

export async function getAgent(id: string): Promise<Agent | null> {
  const response = await request(`/agents/${encodeURIComponent(id)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Unable to load the agent profile');

  const body: unknown = await response.json();
  if (!isAgent(body)) {
    throw new Error('The agent profile returned an invalid response');
  }
  return body;
}

function isAgentAppointment(value: unknown): value is AgentAppointment {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  const therapy = item.therapy as Record<string, unknown> | undefined;
  return (
    typeof item.id === 'string' &&
    (item.status === 'CONFIRMED' || item.status === 'CANCELLED') &&
    typeof therapy?.id === 'string' &&
    typeof therapy.name === 'string' &&
    typeof item.startsAt === 'string' &&
    typeof item.endsAt === 'string' &&
    typeof item.durationMinutes === 'number' &&
    typeof item.cancellationEligible === 'boolean' &&
    typeof item.cancellationDeadline === 'string' &&
    typeof item.displayTimeZone === 'string'
  );
}

export async function getUpcomingAppointments(): Promise<AgentAppointment[]> {
  const response = await requestWithSession('/agent/appointments/upcoming');
  if (!response.ok) throw new Error('Unable to load upcoming appointments');
  const body: unknown = await response.json();
  if (!Array.isArray(body) || !body.every(isAgentAppointment))
    throw new Error('The dashboard returned an invalid response');
  return body;
}

export function getAgentAppointmentsApiUrl(): string {
  return apiUrl;
}
