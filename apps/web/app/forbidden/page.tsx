import Link from 'next/link';
import { PageHeader } from '../components/page-header';
export default function ForbiddenPage() {
  return (
    <>
      <PageHeader
        eyebrow="Access protected"
        title="This area is not available for your account"
        introduction="Your session is active, but this page belongs to another clinic role."
      />
      <Link
        className="text-clinic-brand mt-6 inline-flex min-h-11 items-center font-bold underline"
        href="/"
      >
        Return home
      </Link>
    </>
  );
}
