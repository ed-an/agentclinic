import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAilment, getAilmentTherapies, getAilments } from './ailment-api';

const ailment = {
  id: '16c0b8e2-7a4d-4f91-8c35-2d6e9a1b7f40',
  name: 'Context Switching Fatigue',
  summary: 'Mental drag after moving between tasks.',
  description: 'Calm transitions can restore a steady rhythm.',
};

describe('Ailment API client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads complete and URL-encoded filtered catalogs through the server API', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([ailment])))
      .mockResolvedValueOnce(new Response(JSON.stringify([ailment])));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getAilments()).resolves.toEqual([ailment]);
    await expect(getAilments(' prompt overload ')).resolves.toEqual([ailment]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3001/ailments',
      expect.objectContaining({ cache: 'no-store' }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3001/ailments?q=+prompt+overload+',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('rejects invalid contracts and list failures safely', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ name: 'Partial' }])),
      )
      .mockResolvedValueOnce(new Response(null, { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getAilments()).rejects.toThrow('invalid response');
    await expect(getAilments('x')).rejects.toThrow(
      'Unable to load the ailment catalog',
    );
  });

  it('loads details and distinguishes missing details from failures', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(ailment)))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getAilment(ailment.id)).resolves.toEqual(ailment);
    await expect(getAilment(ailment.id)).resolves.toBeNull();
    await expect(getAilment(ailment.id)).rejects.toThrow(
      'Unable to load the ailment details',
    );
  });

  it('loads associated therapies and rejects failures or invalid contracts', async () => {
    const therapy = {
      id: '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
      name: 'Context Garden Walk',
      summary: 'A gentle guided pause.',
      description: 'A calm sequence of reflection prompts.',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([therapy])))
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ name: 'Partial' }])),
      )
      .mockResolvedValueOnce(new Response(null, { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getAilmentTherapies(ailment.id)).resolves.toEqual([therapy]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `http://localhost:3001/ailments/${ailment.id}/therapies`,
      expect.objectContaining({ cache: 'no-store' }),
    );
    await expect(getAilmentTherapies(ailment.id)).rejects.toThrow(
      'invalid response',
    );
    await expect(getAilmentTherapies(ailment.id)).rejects.toThrow(
      'Unable to load therapies related to this ailment',
    );
  });
});
