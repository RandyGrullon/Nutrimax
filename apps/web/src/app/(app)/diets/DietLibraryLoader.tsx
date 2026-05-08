'use client';

import dynamic from 'next/dynamic';

const DietLibraryClient = dynamic(() => import('./DietLibraryClient'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-6xl px-4 py-12 text-center text-sm text-muted-foreground">
      Cargando biblioteca de dietas…
    </div>
  ),
});

export function DietLibraryLoader() {
  return <DietLibraryClient />;
}
