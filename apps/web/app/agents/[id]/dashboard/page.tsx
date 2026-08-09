import { notFound, redirect } from 'next/navigation';
import { getSession, signInPath } from '../../../auth/auth-api';

export default async function LegacyAgentDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(signInPath(`/agents/${id}/dashboard`));
  if (session.role !== 'AGENT') redirect('/forbidden');
  if (session.agent?.id !== id) notFound();
  redirect('/agent/dashboard');
}
