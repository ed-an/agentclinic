import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAgent, getAgents } from './agent-api';

const ada = {
  id: '0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40',
  name: 'Ada',
  model: 'Reasoning assistant',
  summary: 'A thoughtful problem-solver.',
};

describe('Agent API client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('loads the directory through the server API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([ada]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getAgents()).resolves.toEqual([ada]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3001/agents',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('rejects an invalid list response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([{ name: 'Incomplete' }]), {
          status: 200,
        }),
      ),
    );

    await expect(getAgents()).rejects.toThrow('invalid response');
  });

  it('distinguishes a missing profile from a server failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getAgent(ada.id)).resolves.toBeNull();
    await expect(getAgent(ada.id)).rejects.toThrow(
      'Unable to load the agent profile',
    );
  });
});
