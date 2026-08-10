import { describe, expect, it, vi } from 'vitest';
import { SafeExceptionFilter } from './safe-exception.filter';
import { loadOperationalConfig } from './operational-config';

describe('safe exception reporting', () => {
  it('returns only a stable public error and request ID for internal failures', () => {
    const send = vi.fn();
    const status = vi.fn(() => ({ send }));
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ id: 'request-safe' }),
        getResponse: () => ({ status }),
      }),
    };
    const write = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    new SafeExceptionFilter(
      loadOperationalConfig({
        NODE_ENV: 'test',
        DATABASE_URL: 'file:/tmp/filter.db',
      }),
    ).catch(new Error('private internal detail'), host as never);
    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Unable to complete request',
      requestId: 'request-safe',
    });
    expect(JSON.stringify(send.mock.calls)).not.toContain(
      'private internal detail',
    );
    write.mockRestore();
  });
});
