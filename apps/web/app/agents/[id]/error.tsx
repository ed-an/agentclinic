'use client';

import Link from 'next/link';
import { ErrorState } from '../../components/states/error-state';

export default function AgentDetailError({ reset }: { reset: () => void }) {
  return (
    <>
      <ErrorState
        message="This agent profile is unavailable right now. Please try again."
        onRetry={reset}
        title="We could not open this profile"
      />
      <Link
        className="text-clinic-brand hover:text-clinic-brand-strong mt-6 inline-flex min-h-11 items-center font-bold underline decoration-2 underline-offset-4"
        href="/agents"
      >
        Return to agent directory
      </Link>
    </>
  );
}
