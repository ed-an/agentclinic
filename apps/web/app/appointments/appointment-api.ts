export type BookingContext = Readonly<{
  slotId: string;
  therapy: { id: string; name: string };
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  displayTimeZone: string;
}>;
export type AppointmentConfirmation = Readonly<{
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  therapy: { id: string; name: string };
  agent: { id: string; name: string };
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  displayTimeZone: string;
  createdAt: string;
}>;

const apiUrl = process.env.AGENTCLINIC_API_URL ?? 'http://127.0.0.1:3001';
export class ApiStatusError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  });
  if (!response.ok)
    throw new ApiStatusError(
      response.status,
      'The requested booking information could not be loaded',
    );
  return response.json() as Promise<T>;
}

export function getBookingContext(slotId: string): Promise<BookingContext> {
  return getJson(`/appointments/booking-context/${encodeURIComponent(slotId)}`);
}
export function getAppointment(id: string): Promise<AppointmentConfirmation> {
  return getJson(`/appointments/${encodeURIComponent(id)}`);
}
export function getBookingApiUrl(): string {
  return apiUrl;
}
