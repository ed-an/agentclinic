'use client';

import { ErrorState } from '../components/states/error-state';

export default function AilmentsError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      message="The ailment catalog is unavailable right now. Please try again."
      onRetry={reset}
      title="We could not open the catalog"
    />
  );
}
