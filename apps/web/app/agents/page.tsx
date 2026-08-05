import type { Metadata } from 'next';
import { FutureAreaPage } from '../components/future-area-page';

export const metadata: Metadata = { title: 'Agents | AgentClinic' };

export default function AgentsPage() {
  return (
    <FutureAreaPage
      area="Agents"
      introduction="A reassuring directory for the agents who visit the clinic will arrive here."
      roadmapPhase={3}
    />
  );
}
