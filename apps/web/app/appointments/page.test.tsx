import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Session } from '../auth/auth-api';
import { getSession } from '../auth/auth-api';
import AppointmentsPage from './page';

vi.mock('../auth/auth-api', async (importOriginal) => {
  const original = await importOriginal<typeof import('../auth/auth-api')>();
  return { ...original, getSession: vi.fn() };
});

function session(role: 'AGENT' | 'STAFF'): Session {
  return {
    accountId: `${role.toLowerCase()}-account`,
    email: `${role.toLowerCase()}@example.test`,
    role,
    agent: role === 'AGENT' ? { id: 'agent-id', name: 'Test Agent' } : null,
    expiresAt: '2035-06-15T03:00:00.000Z',
    csrfToken: 'test-csrf-token',
  };
}

describe('AppointmentsPage', () => {
  it('directs signed-out visitors to booking and a safe sign-in return path', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    render(await AppointmentsPage());

    expect(
      screen.getByRole('link', { name: 'Browse therapies' }),
    ).toHaveAttribute('href', '/therapies');
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/sign-in?returnTo=%2Fappointments',
    );
  });

  it('directs Agents to their own dashboard', async () => {
    vi.mocked(getSession).mockResolvedValue(session('AGENT'));
    render(await AppointmentsPage());

    expect(
      screen.getByRole('link', { name: 'Open my dashboard' }),
    ).toHaveAttribute('href', '/agent/dashboard');
  });

  it('directs Staff to the protected appointment queue', async () => {
    vi.mocked(getSession).mockResolvedValue(session('STAFF'));
    render(await AppointmentsPage());

    expect(
      screen.getByRole('link', { name: 'Open staff queue' }),
    ).toHaveAttribute('href', '/staff/appointments');
  });

  it('keeps public discovery available when session lookup fails safely', async () => {
    vi.mocked(getSession).mockRejectedValue(new Error('internal detail'));
    render(await AppointmentsPage());

    expect(
      screen.getByRole('heading', { name: 'Account view unavailable' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/internal detail/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Browse therapies' }),
    ).toHaveAttribute('href', '/therapies');
    expect(
      screen.getByRole('link', { name: 'Try signing in' }),
    ).toHaveAttribute('href', '/sign-in?returnTo=%2Fappointments');
  });
});
