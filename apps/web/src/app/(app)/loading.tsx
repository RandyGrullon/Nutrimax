import { PageLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton';

export default function AppSegmentLoading() {
  return (
    <div className="flex min-h-[50vh] w-full items-start pt-6">
      <PageLoadingSkeleton label="Cargando página…" className="w-full" />
    </div>
  );
}
