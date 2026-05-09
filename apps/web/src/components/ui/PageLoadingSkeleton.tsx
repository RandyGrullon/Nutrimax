import { Skeleton } from '@/components/ui/Skeleton';

type PageLoadingSkeletonProps = {
  label?: string;
  className?: string;
};

export function PageLoadingSkeleton({ label = 'Cargando…', className = '' }: PageLoadingSkeletonProps) {
  return (
    <div
      className={`flex flex-col gap-6 ${className}`}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand-600 border-t-transparent dark:border-brand-400"
          aria-hidden
        />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <Skeleton className="h-9 w-2/3 max-w-md rounded-lg" />
      <Skeleton className="h-[min(420px,55vh)] w-full rounded-2xl" />
    </div>
  );
}
