import { Skeleton } from '@/components/ui/Skeleton';

type PageLoadingSkeletonProps = {
  label?: string;
  className?: string;
};

export function PageLoadingSkeleton({ label = 'Cargando…', className = '' }: PageLoadingSkeletonProps) {
  return (
    <div
      className={`flex flex-col gap-5 ${className}`}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <Skeleton className="h-4 w-40 rounded-md" />
      <span className="sr-only">{label}</span>
      <Skeleton className="h-9 w-2/3 max-w-md rounded-lg" />
      <Skeleton className="h-[min(380px,50vh)] w-full rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}
