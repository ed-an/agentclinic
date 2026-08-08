import Link from 'next/link';
import { EmptyState } from '../../../components/states/empty-state';

export default function AgentDashboardNotFound() {
  return (
    <EmptyState
      action={
        <Link
          className="bg-clinic-brand inline-flex min-h-11 items-center rounded-full px-5 py-2 font-semibold text-white"
          href="/agents"
        >
          Return to Agent selection
        </Link>
      }
      message="This Agent dashboard could not be found. Choose an Agent from the directory."
      title="Agent dashboard not found"
    />
  );
}
