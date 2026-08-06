export type Ailment = Readonly<{
  id: string;
  name: string;
  summary: string;
  description: string;
}>;

const apiUrl = process.env.AGENTCLINIC_API_URL ?? 'http://127.0.0.1:3001';

function isAilment(value: unknown): value is Ailment {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return ['id', 'name', 'summary', 'description'].every(
    (field) => typeof candidate[field] === 'string',
  );
}

async function request(path: string): Promise<Response> {
  return fetch(`${apiUrl}${path}`, {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  });
}

export async function getAilments(query?: string): Promise<Ailment[]> {
  const parameters = new URLSearchParams();
  if (query !== undefined) parameters.set('q', query);
  const queryString = parameters.size > 0 ? `?${parameters.toString()}` : '';
  const response = await request(`/ailments${queryString}`);
  if (!response.ok) throw new Error('Unable to load the ailment catalog');

  const body: unknown = await response.json();
  if (!Array.isArray(body) || !body.every(isAilment)) {
    throw new Error('The ailment catalog returned an invalid response');
  }
  return body;
}

export async function getAilment(id: string): Promise<Ailment | null> {
  const response = await request(`/ailments/${encodeURIComponent(id)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Unable to load the ailment details');

  const body: unknown = await response.json();
  if (!isAilment(body)) {
    throw new Error('The ailment details returned an invalid response');
  }
  return body;
}
