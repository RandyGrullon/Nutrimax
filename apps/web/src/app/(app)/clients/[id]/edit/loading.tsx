import { PageLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton';

export default function ClientEditLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <PageLoadingSkeleton label="Cargando editor de ficha…" className="w-full" />
    </div>
  );
}
