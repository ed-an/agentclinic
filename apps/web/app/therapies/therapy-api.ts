export type Therapy = Readonly<{
  id: string;
  name: string;
  summary: string;
  description: string;
}>;

export type AssociatedAilment = Readonly<{
  id: string;
  name: string;
}>;

export type TherapyDetail = Therapy &
  Readonly<{
    ailments: AssociatedAilment[];
  }>;

const apiUrl = process.env.AGENTCLINIC_API_URL ?? 'http://127.0.0.1:3001';

function isTherapy(value: unknown): value is Therapy {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return ['id', 'name', 'summary', 'description'].every(
    (field) => typeof candidate[field] === 'string',
  );
}

function isAssociatedAilment(value: unknown): value is AssociatedAilment {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string' && typeof candidate.name === 'string';
}

function isTherapyDetail(value: unknown): value is TherapyDetail {
  if (!isTherapy(value)) return false;
  const ailments = (value as Record<string, unknown>).ailments;
  return Array.isArray(ailments) && ailments.every(isAssociatedAilment);
}

async function request(path: string): Promise<Response> {
  return fetch(`${apiUrl}${path}`, {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  });
}

export async function getTherapies(): Promise<Therapy[]> {
  const response = await request('/therapies');
  if (!response.ok) throw new Error('Unable to load the therapy catalog');

  const body: unknown = await response.json();
  if (!Array.isArray(body) || !body.every(isTherapy)) {
    throw new Error('The therapy catalog returned an invalid response');
  }
  return body;
}

export async function getTherapy(id: string): Promise<TherapyDetail | null> {
  const response = await request(`/therapies/${encodeURIComponent(id)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Unable to load the therapy details');

  const body: unknown = await response.json();
  if (!isTherapyDetail(body)) {
    throw new Error('The therapy details returned an invalid response');
  }
  return body;
}
