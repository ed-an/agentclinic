'use client';

import { ErrorState } from '../components/states/error-state';

export default function TherapiesError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      message="The therapy catalog is unavailable right now. Please try again."
      onRetry={reset}
      title="We could not open the therapy catalog"
    />
  );
}
