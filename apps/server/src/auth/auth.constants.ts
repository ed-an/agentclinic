export const SESSION_COOKIE = 'agentclinic_session';
export const CSRF_COOKIE = 'agentclinic_csrf';
export const CSRF_HEADER = 'x-agentclinic-csrf';
export const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;
export const SIGN_IN_LIMIT = 5;
export const SIGN_IN_WINDOW_MS = 15 * 60 * 1000;
export const AUTHENTICATED_CACHE_CONTROL = 'private, no-store, max-age=0';

export type AccountRole = 'AGENT' | 'STAFF';

export interface AuthenticatedAccount {
  accountId: string;
  email: string;
  role: AccountRole;
  agentId: string | null;
  agentName: string | null;
  sessionId: string;
  expiresAt: Date;
  csrfTokenHash: string;
}
