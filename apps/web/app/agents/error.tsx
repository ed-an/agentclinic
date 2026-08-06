'use client';

import { ErrorState } from '../components/states/error-state';

export default function AgentsError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      message="The agent directory is unavailable right now. Please try again."
      onRetry={reset}
      title="We could not open the directory"
    />
  );
}
