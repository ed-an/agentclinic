export const DEFAULT_DATABASE_URL = 'file:./prisma/dev.db';

export function getDatabaseUrl(
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const databaseUrl = environment.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL;

  if (!databaseUrl.startsWith('file:') || databaseUrl === 'file:') {
    throw new Error('DATABASE_URL must be a non-empty SQLite file: URL.');
  }

  return databaseUrl;
}
