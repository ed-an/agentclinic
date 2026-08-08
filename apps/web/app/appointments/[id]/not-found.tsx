import Link from 'next/link';
export default function NotFound() {
  return (
    <section>
      <h1 className="text-4xl font-bold">Booking confirmation not found</h1>
      <p className="text-clinic-muted mt-4">
        Check the reference or return to the Therapy catalog.
      </p>
      <Link
        className="text-clinic-brand mt-5 inline-flex min-h-11 items-center font-bold underline"
        href="/therapies"
      >
        Browse therapies
      </Link>
    </section>
  );
}
