'use client';

import { ErrorState } from '../../../components/states/error-state';

export default function AgentDashboardError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      message="The dashboard is unavailable right now. No appointment was changed."
      onRetry={reset}
      title="We could not open the dashboard"
    />
  );
}
