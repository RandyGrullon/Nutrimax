import { PageLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton';

export default function LoginLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-12">
      <PageLoadingSkeleton label="Cargando…" className="w-full" />
    </main>
  );
}
