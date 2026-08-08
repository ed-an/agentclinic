import { LoadingState } from '../../../components/states/loading-state';

export default function AgentDashboardLoading() {
  return (
    <LoadingState message="Checking confirmed appointments and cancellation eligibility." />
  );
}
