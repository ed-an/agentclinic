import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentAppointment } from '../../agent-api';
import { AppointmentDashboard } from './appointment-dashboard';
import AgentDashboardError from './error';
import AgentDashboardLoading from './loading';
import AgentDashboardNotFound from './not-found';

const appointment: AgentAppointment = {
  id: 'e0000000-0000-4000-8000-000000000001',
  status: 'CONFIRMED',
  therapy: {
    id: '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
    name: 'Context Garden Walk',
  },
  startsAt: '2035-06-15T02:30:00.000Z',
  endsAt: '2035-06-15T03:15:00.000Z',
  durationMinutes: 45,
  cancellationEligible: true,
  cancellationDeadline: '2035-06-14T02:30:00.000Z',
  displayTimeZone: 'America/Sao_Paulo',
};

describe('AppointmentDashboard', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('shows operational details, deadline, and an accessible confirmation', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(
      <AppointmentDashboard
        agentId="0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40"
        apiUrl="http://api.test"
        initialAppointments={[appointment]}
      />,
    );
    expect(screen.getByText('Context Garden Walk')).toBeInTheDocument();
    expect(screen.getByText(/Cancel by/)).toBeInTheDocument();
    expect(baseElement.textContent).not.toContain('visitor@example.test');
    await user.click(
      screen.getByRole('button', { name: 'Cancel appointment' }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Cancel Context Garden Walk?' }),
      ).toHaveFocus(),
    );
    await user.click(screen.getByRole('button', { name: 'Keep appointment' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Cancel appointment' }),
      ).toHaveFocus(),
    );
    const results = await axe.run(baseElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it('disables duplicate submission and immediately shows success and empty state', async () => {
    let resolveFetch!: (response: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );
    render(
      <AppointmentDashboard
        agentId="0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40"
        apiUrl="http://api.test"
        initialAppointments={[appointment]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel appointment' }));
    const confirm = screen.getByRole('button', {
      name: 'Confirm cancellation',
    });
    fireEvent.click(confirm);
    expect(screen.getByRole('button', { name: 'Cancelling…' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelling…' }));
    expect(fetch).toHaveBeenCalledTimes(1);
    resolveFetch(
      new Response(JSON.stringify({ status: 'CANCELLED' }), { status: 200 }),
    );
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Context Garden Walk was cancelled',
      ),
    );
    expect(
      screen.getByRole('heading', { name: 'No upcoming appointments' }),
    ).toBeInTheDocument();
  });

  it('keeps the appointment and offers recovery after conflict or failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(new Response(null, { status: 409 })),
    );
    render(
      <AppointmentDashboard
        agentId="0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40"
        apiUrl="http://api.test"
        initialAppointments={[appointment]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel appointment' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm cancellation' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'no longer eligible',
    );
    expect(screen.getByText('Context Garden Walk')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reload dashboard' }),
    ).toBeEnabled();
  });

  it('renders empty, loading, not-found, and retryable error states', () => {
    const { rerender } = render(
      <AppointmentDashboard
        agentId="0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40"
        apiUrl="http://api.test"
        initialAppointments={[]}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'No upcoming appointments' }),
    ).toBeInTheDocument();
    rerender(<AgentDashboardLoading />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Checking confirmed appointments',
    );
    rerender(<AgentDashboardNotFound />);
    expect(
      screen.getByRole('heading', { name: 'Agent dashboard not found' }),
    ).toBeInTheDocument();
    rerender(<AgentDashboardError reset={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not open the dashboard',
    );
  });
});
