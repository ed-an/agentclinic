import type { FastifyReply } from 'fastify';
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  SESSION_LIFETIME_MS,
} from './auth.constants';

export function parseSessionCookie(header: string | undefined): string | null {
  return parseCookie(header, SESSION_COOKIE);
}

export function parseCsrfCookie(header: string | undefined): string | null {
  return parseCookie(header, CSRF_COOKIE);
}

function parseCookie(
  header: string | undefined,
  cookieName: string,
): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === cookieName) {
      const value = rest.join('=');
      return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
    }
  }
  return null;
}

export function setAuthCookies(
  reply: FastifyReply,
  token: string,
  csrfToken: string,
  expiresAt: Date,
): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const attributes = `Path=/; SameSite=Lax; Max-Age=${SESSION_LIFETIME_MS / 1000}; Expires=${expiresAt.toUTCString()}${secure}`;
  reply.header('set-cookie', [
    `${SESSION_COOKIE}=${token}; ${attributes}; HttpOnly`,
    `${CSRF_COOKIE}=${csrfToken}; ${attributes}`,
  ]);
}

export function clearSessionCookie(reply: FastifyReply): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const expired = `Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
  reply.header('set-cookie', [
    `${SESSION_COOKIE}=; ${expired}; HttpOnly`,
    `${CSRF_COOKIE}=; ${expired}`,
  ]);
}
