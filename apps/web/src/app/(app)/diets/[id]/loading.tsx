import { PageLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton';

export default function DietDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <PageLoadingSkeleton label="Cargando plan…" className="w-full" />
    </div>
  );
}
