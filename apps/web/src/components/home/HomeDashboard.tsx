import type { DashboardRecentClient, DashboardStats } from '@/lib/dashboard-stats-types';
import { HomeDashboardHero } from './HomeDashboardHero';
import { HomeQuickLinks } from './HomeQuickLinks';
import { HomeWorkflow, HomeActivity, HomeFooterInfo } from './HomeActivity';

/**
 * Dashboard (Server Component).
 * Al consolidar el Hero y las Stats en un solo componente cliente atómico,
 * eliminamos la causa raíz del error de Webpack «Cannot read properties of undefined (reading 'call')».
 */
export function HomeDashboard({
  user,
  stats,
  recentClients,
}: {
  user: { email?: string | null } | null;
  stats: DashboardStats;
  recentClients: DashboardRecentClient[];
}) {
  const email = user?.email ?? null;
  const displayName = email ? email.split('@')[0] : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-brand-600/[0.11] via-background to-violet-600/[0.08] shadow-card dark:border-white/[0.07] dark:from-brand-500/[0.14] dark:to-violet-600/[0.12]">
        <div className="relative p-6 sm:p-8 lg:p-10">
          {/* Un solo punto de entrada cliente para toda la zona interactiva superior */}
          <HomeDashboardHero email={email} displayName={displayName} stats={stats} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="space-y-6 lg:col-span-2">
          <HomeQuickLinks />
          <HomeWorkflow />
          <HomeFooterInfo />
        </div>
        <aside className="lg:col-span-1">
          <HomeActivity recentClients={recentClients} />
        </aside>
      </div>
    </div>
  );
}
