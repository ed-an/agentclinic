import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getTherapies,
  getTherapy,
  getTherapyAvailability,
} from './therapy-api';

const therapy = {
  id: '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
  name: 'Context Garden Walk',
  summary: 'A gentle guided pause.',
  description: 'A calm sequence of reflection prompts.',
};
const detail = {
  ...therapy,
  ailments: [
    {
      id: '16c0b8e2-7a4d-4f91-8c35-2d6e9a1b7f40',
      name: 'Context Switching Fatigue',
    },
  ],
};

describe('Therapy API client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads the catalog through the server API', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([therapy])));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTherapies()).resolves.toEqual([therapy]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/therapies',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('rejects invalid catalog contracts and failures safely', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ name: 'Partial' }])),
      )
      .mockResolvedValueOnce(new Response(null, { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTherapies()).rejects.toThrow('invalid response');
    await expect(getTherapies()).rejects.toThrow(
      'Unable to load the therapy catalog',
    );
  });

  it('loads details and distinguishes missing, invalid, and failed responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(detail)))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...therapy, ailments: [{}] })),
      )
      .mockResolvedValueOnce(new Response(null, { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTherapy(therapy.id)).resolves.toEqual(detail);
    await expect(getTherapy(therapy.id)).resolves.toBeNull();
    await expect(getTherapy(therapy.id)).rejects.toThrow('invalid response');
    await expect(getTherapy(therapy.id)).rejects.toThrow(
      'Unable to load the therapy details',
    );
  });

  it('loads availability through the server API', async () => {
    const slot = {
      id: '8d4a1b68-9c32-4e86-b520-3a6d7f0c4e18',
      therapyId: therapy.id,
      startsAt: '2035-06-15T02:30:00.000Z',
      durationMinutes: 45,
      endsAt: '2035-06-15T03:15:00.000Z',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([slot])));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTherapyAvailability(therapy.id)).resolves.toEqual([slot]);
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3001/therapies/${therapy.id}/availability`,
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('rejects invalid availability contracts and failures safely', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ id: 'partial', durationMinutes: 0 }])),
      )
      .mockResolvedValueOnce(new Response(null, { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTherapyAvailability(therapy.id)).rejects.toThrow(
      'invalid response',
    );
    await expect(getTherapyAvailability(therapy.id)).rejects.toThrow(
      'Unable to load therapy availability',
    );
  });
});
