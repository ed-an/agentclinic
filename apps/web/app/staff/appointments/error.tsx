'use client';

import { ErrorState } from '../../components/states/error-state';

export default function StaffAppointmentsError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <ErrorState
      title="The staff queue could not be loaded"
      message="No appointment was changed. Please retry the queue safely."
      onRetry={reset}
    />
  );
}
