'use client';

import Link from 'next/link';
import { ErrorState } from '../../components/states/error-state';

export default function AilmentDetailError({ reset }: { reset: () => void }) {
  return (
    <>
      <ErrorState
        message="This ailment guide is unavailable right now. Please try again."
        onRetry={reset}
        title="We could not open this ailment"
      />
      <Link
        className="text-clinic-brand hover:text-clinic-brand-strong mt-6 inline-flex min-h-11 items-center font-bold underline decoration-2 underline-offset-4"
        href="/ailments"
      >
        Return to ailment catalog
      </Link>
    </>
  );
}
