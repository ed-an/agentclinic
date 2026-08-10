import { describe, expect, it } from 'vitest';
import {
  effectiveRequestId,
  REQUEST_ID_PATTERN,
  writeLog,
} from './structured-logger';

describe('structured operational logging', () => {
  it('propagates strict IDs and replaces malformed or injected IDs', () => {
    expect(effectiveRequestId('request_123.OK')).toBe('request_123.OK');
    for (const value of ['', 'has space', 'line\nforged', 'x'.repeat(65)])
      expect(effectiveRequestId(value)).toMatch(REQUEST_ID_PATTERN);
  });

  it('writes one parseable line with only approved fields', () => {
    let output = '';
    writeLog(
      {
        severity: 'info',
        event: 'http.request.completed',
        service: 'agentclinic-server',
        environment: 'test',
        requestId: 'safe-id',
        method: 'GET',
        route: '/agents/:id',
        status: 200,
        durationMs: 1.5,
      },
      { write: (value) => ((output += String(value)), true) },
    );
    expect(output.split('\n')).toHaveLength(2);
    expect(JSON.parse(output)).toMatchObject({
      event: 'http.request.completed',
      route: '/agents/:id',
      requestId: 'safe-id',
    });
    expect(output).not.toMatch(/cookie|authorization|query|body|token/i);
  });
});
