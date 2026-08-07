'use client';

import Link from 'next/link';
import { ErrorState } from '../../components/states/error-state';

export default function TherapyDetailError({ reset }: { reset: () => void }) {
  return (
    <>
      <ErrorState
        message="This therapy guide is unavailable right now. Please try again."
        onRetry={reset}
        title="We could not open this therapy"
      />
      <Link
        className="text-clinic-brand hover:text-clinic-brand-strong mt-6 inline-flex min-h-11 items-center font-bold underline decoration-2 underline-offset-4"
        href="/therapies"
      >
        Return to therapy catalog
      </Link>
    </>
  );
}
