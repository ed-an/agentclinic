import { describe, expect, it } from 'vitest';
import { getAgentAppointmentsApiUrl } from './agents/agent-api';
import { getBookingApiUrl } from './appointments/appointment-api';
import { apiUrl } from './auth/auth-api';
import { getStaffAppointmentsApiUrl } from './staff/appointments/staff-appointment-api';

describe('server API URL defaults', () => {
  it('uses the documented local hostname for authenticated adapters', () => {
    expect(apiUrl).toBe('http://localhost:3001');
    expect(getAgentAppointmentsApiUrl()).toBe('http://localhost:3001');
    expect(getBookingApiUrl()).toBe('http://localhost:3001');
    expect(getStaffAppointmentsApiUrl()).toBe('http://localhost:3001');
  });
});
