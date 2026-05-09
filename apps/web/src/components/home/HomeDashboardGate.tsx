'use client';

import dynamic from 'next/dynamic';
import type { DashboardRecentClient, DashboardStats } from '@/lib/dashboard-stats-types';
import { PageLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton';

const HomeDashboardLazy = dynamic(() => import('@/components/home/HomeDashboard'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
      <PageLoadingSkeleton label="Cargando panel…" />
    </div>
  ),
});

/**
 * Envoltorio cliente: `dynamic(..., { ssr: false })` solo es válido desde un Client Component.
 * Evita el fallo Webpack `reading 'call'` al combinar RSC + este bundle en el primer paint.
 */
export function HomeDashboardGate(props: {
  user: { email?: string | null } | null;
  stats: DashboardStats;
  recentClients: DashboardRecentClient[];
}) {
  return <HomeDashboardLazy {...props} />;
}
