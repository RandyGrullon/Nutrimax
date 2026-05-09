import { PageLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton';

export default function ClientDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PageLoadingSkeleton label="Cargando ficha del paciente…" className="w-full" />
    </div>
  );
}
