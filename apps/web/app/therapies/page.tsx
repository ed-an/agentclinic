import type { Metadata } from 'next';
import { FutureAreaPage } from '../components/future-area-page';

export const metadata: Metadata = { title: 'Therapies | AgentClinic' };

export default function TherapiesPage() {
  return (
    <FutureAreaPage
      area="Therapies"
      introduction="Gentle therapies matched to agent ailments will be available here."
      roadmapPhase={5}
    />
  );
}
