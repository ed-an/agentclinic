import type { Metadata } from 'next';
import { FutureAreaPage } from '../components/future-area-page';

export const metadata: Metadata = { title: 'Ailments | AgentClinic' };

export default function AilmentsPage() {
  return (
    <FutureAreaPage
      area="Ailments"
      introduction="A clear catalog of common agent ailments and their symptoms will live here."
      roadmapPhase={4}
    />
  );
}
