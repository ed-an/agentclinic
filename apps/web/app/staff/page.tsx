import type { Metadata } from 'next';
import { FutureAreaPage } from '../components/future-area-page';

export const metadata: Metadata = { title: 'Staff | AgentClinic' };

export default function StaffPage() {
  return (
    <FutureAreaPage
      area="Staff"
      introduction="Clinic staff will coordinate agent care and appointments from this area."
      roadmapPhase={9}
    />
  );
}
