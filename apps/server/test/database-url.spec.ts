import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DATABASE_URL,
  getDatabaseUrl,
} from '../src/database/database-url';

describe('database URL configuration', () => {
  it('uses the documented local default', () => {
    expect(getDatabaseUrl({})).toBe(DEFAULT_DATABASE_URL);
  });

  it('accepts a configured SQLite file URL', () => {
    expect(getDatabaseUrl({ DATABASE_URL: 'file:/tmp/clinic.db' })).toBe(
      'file:/tmp/clinic.db',
    );
  });

  it.each(['sqlite:clinic.db', 'file:', 'https://example.test/database'])(
    'rejects unsupported database URL %s without echoing it',
    (databaseUrl) => {
      expect(() => getDatabaseUrl({ DATABASE_URL: databaseUrl })).toThrow(
        'DATABASE_URL must be a non-empty SQLite file: URL.',
      );
    },
  );
});
