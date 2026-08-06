export type Agent = Readonly<{
  id: string;
  name: string;
  model: string;
  summary: string;
}>;

const apiUrl = process.env.AGENTCLINIC_API_URL ?? 'http://127.0.0.1:3001';

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
