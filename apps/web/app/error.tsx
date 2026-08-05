'use client';

import { ErrorState } from './components/states/error-state';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <ErrorState onRetry={reset} />;
}
