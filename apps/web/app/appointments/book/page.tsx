import Link from 'next/link';
import { getAgents } from '../../agents/agent-api';
import {
  ApiStatusError,
  getBookingApiUrl,
  getBookingContext,
} from '../appointment-api';
import { BookingForm } from './booking-form';

export default async function BookAppointmentPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ slotId?: string }> }>) {
  const { slotId } = await searchParams;
  if (!slotId)
    return (
      <State
        title="Choose an available time"
        message="Open a Therapy page and select one of its available times."
      />
    );
  try {
    const [context, agents] = await Promise.all([
      getBookingContext(slotId),
      getAgents(),
    ]);
    return (
      <>
        <h1 className="text-4xl font-bold">Book an appointment</h1>
        <p className="text-clinic-muted mt-4 text-lg">
          Review authoritative availability and choose an Agent.
        </p>
        <BookingForm
          context={context}
          agents={agents}
          apiUrl={getBookingApiUrl()}
        />
      </>
    );
  } catch (error) {
    if (error instanceof ApiStatusError && error.status === 404)
      return (
        <State
          title="Time not found"
          message="This availability record could not be found."
        />
      );
    if (error instanceof ApiStatusError && error.status === 400)
      return (
        <State
          title="Invalid availability reference"
          message="Return to Therapy availability and choose a valid time."
        />
      );
    if (error instanceof ApiStatusError && error.status === 409)
      return (
        <State
          title="Time no longer available"
          message="This time is past, unavailable, or already booked. Choose another time."
        />
      );
    throw error;
  }
}
function State({
  title,
  message,
}: Readonly<{ title: string; message: string }>) {
  return (
    <section>
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="text-clinic-muted mt-4 text-lg">{message}</p>
      <Link
        className="text-clinic-brand mt-5 inline-flex min-h-11 items-center font-bold underline"
        href="/therapies"
      >
        Browse therapies
      </Link>
    </section>
  );
}
