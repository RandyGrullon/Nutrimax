'use client';

import { NavRoutePrefetcher } from '@/components/layout/NavRoutePrefetcher';

/**
 * Cuerpo del shell (cliente): prefetch de rutas y área de página.
 * La cabecera y el nav viven en `AppShellHeader` (servidor) para hidratación estable.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col bg-background nb-surface-glow"
      suppressHydrationWarning
    >
      <NavRoutePrefetcher />
      <div className="flex-1">{children}</div>
    </div>
  );
}
