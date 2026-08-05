import type { Metadata } from 'next';
import { FutureAreaPage } from '../components/future-area-page';

export const metadata: Metadata = { title: 'Appointments | AgentClinic' };

export default function AppointmentsPage() {
  return (
    <FutureAreaPage
      area="Appointments"
      introduction="A calm path to finding and managing care appointments will begin here."
      roadmapPhase={6}
    />
  );
}
