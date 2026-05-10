import { PageLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton';

export default function ClientsNewLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <PageLoadingSkeleton label="Preparando asistente de registro…" className="w-full" />
    </div>
  );
}
