import { PageHeader } from './page-header';
import { EmptyState } from './states/empty-state';

type FutureAreaPageProps = Readonly<{
  area: string;
  introduction: string;
  roadmapPhase: number;
}>;

export function FutureAreaPage({
  area,
  introduction,
  roadmapPhase,
}: FutureAreaPageProps) {
  return (
    <>
      <PageHeader
        eyebrow={`Planned for Phase ${roadmapPhase}`}
        introduction={introduction}
        title={area}
      />
      <EmptyState
        message="This area is intentionally waiting for its focused delivery phase. Nothing needs your attention here yet."
        title={`${area} will be ready soon`}
      />
    </>
  );
}
