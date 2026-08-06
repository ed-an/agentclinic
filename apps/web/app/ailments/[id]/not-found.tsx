import Link from 'next/link';
import { EmptyState } from '../../components/states/empty-state';

export default function AilmentNotFound() {
  return (
    <EmptyState
      action={
        <Link
          className="bg-clinic-brand hover:bg-clinic-brand-strong inline-flex min-h-11 items-center rounded-full px-5 py-2 font-semibold text-white"
          href="/ailments"
        >
          Return to ailment catalog
        </Link>
      }
      message="This ailment is not in the catalog. It may have moved or never existed."
      title="Ailment not found"
    />
  );
}
