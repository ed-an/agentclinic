import Link from 'next/link';
import { EmptyState } from '../../components/states/empty-state';

export default function AgentNotFound() {
  return (
    <EmptyState
      action={
        <Link
          className="bg-clinic-brand hover:bg-clinic-brand-strong inline-flex min-h-11 items-center rounded-full px-5 py-2 font-semibold text-white"
          href="/agents"
        >
          Return to agent directory
        </Link>
      }
      message="This agent profile is not in the directory. It may have moved or never existed."
      title="Agent not found"
    />
  );
}
