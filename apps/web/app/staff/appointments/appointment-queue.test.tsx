import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentQueue } from './appointment-queue';
import type { StaffAppointment } from './staff-appointment-api';

const pending: StaffAppointment = {
  id: 'e0000000-0000-4000-8000-000000000001',
  status: 'PENDING',
  agent: { id: '0b3d5a7e-1f24-4c68-9a02-3e5f7b8d1c40', name: 'Ada' },
  therapy: {
    id: '1d7f3a90-2b64-4c18-8e52-6a9d0f3b7c41',
    name: 'Context Garden Walk',
  },
  startsAt: '2035-06-15T02:30:00.000Z',
  endsAt: '2035-06-15T03:15:00.000Z',
  durationMinutes: 45,
  displayTimeZone: 'America/Sao_Paulo',
  createdAt: '2035-05-01T12:00:00.000Z',
  lastStatusChangedAt: '2035-05-01T12:00:00.000Z',
  confirmationAllowed: true,
  cancellationAllowed: true,
};

describe('AppointmentQueue', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders approved details and accessible explicit actions', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(
      <AppointmentQueue
        initialAppointments={[pending]}
        apiUrl="http://api.test"
        filtered={false}
        visibleStatuses={[]}
      />,
    );
    expect(screen.getByText('Agent: Ada')).toBeInTheDocument();
    expect(baseElement.textContent).not.toContain('visitor@example.test');
    await user.click(
      screen.getByRole('button', { name: 'Cancel appointment' }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: 'Cancel Context Garden Walk?' }),
      ).toHaveFocus(),
    );
    expect(
      screen.getByRole('button', { name: 'Confirm cancellation' }),
    ).toBeDisabled();
    await user.selectOptions(
      screen.getByLabelText('Cancellation reason'),
      'SCHEDULE_CHANGE',
    );
    expect(
      screen.getByRole('button', { name: 'Confirm cancellation' }),
    ).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Go back' }));
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

  it('protects duplicate submission and immediately reconciles confirmation', async () => {
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
      <AppointmentQueue
        initialAppointments={[pending]}
        apiUrl="http://api.test"
        filtered={false}
        visibleStatuses={[]}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm appointment' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm request' }));
    expect(screen.getByRole('button', { name: 'Updating…' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Updating…' }));
    expect(fetch).toHaveBeenCalledTimes(1);
    resolveFetch(
      new Response(
        JSON.stringify({
          ...pending,
          status: 'CONFIRMED',
          confirmationAllowed: false,
        }),
        { status: 200 },
      ),
    );
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('is now confirmed'),
    );
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
  });

  it('removes cancellation from the default queue and shows conflict recovery', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...pending,
            status: 'CANCELLED',
            confirmationAllowed: false,
            cancellationAllowed: false,
          }),
          { status: 200 },
        ),
      ),
    );
    const { unmount } = render(
      <AppointmentQueue
        initialAppointments={[pending]}
        apiUrl="http://api.test"
        filtered={false}
        visibleStatuses={[]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel appointment' }));
    fireEvent.change(screen.getByLabelText('Cancellation reason'), {
      target: { value: 'STAFF_UNAVAILABLE' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm cancellation' }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'is now cancelled',
    );
    expect(
      screen.getByRole('heading', { name: 'Queue is clear' }),
    ).toBeInTheDocument();

    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 409 }));
    unmount();
    render(
      <AppointmentQueue
        initialAppointments={[pending]}
        apiUrl="http://api.test"
        filtered={false}
        visibleStatuses={[]}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm appointment' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm request' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'no longer eligible',
    );
    expect(screen.getByRole('button', { name: 'Reload queue' })).toBeEnabled();
  });

  it('distinguishes default and filtered empty states', () => {
    const { rerender } = render(
      <AppointmentQueue
        initialAppointments={[]}
        apiUrl="http://api.test"
        filtered={false}
        visibleStatuses={[]}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'Queue is clear' }),
    ).toBeInTheDocument();
    rerender(
      <AppointmentQueue
        initialAppointments={[]}
        apiUrl="http://api.test"
        filtered
        visibleStatuses={['CANCELLED']}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'No matching appointments' }),
    ).toBeInTheDocument();
  });
});
