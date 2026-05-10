import { unstable_cache } from 'next/cache';
import type { DashboardRecentClient, DashboardStats } from '@/lib/dashboard-stats-types';
import { dbQuery, dbQueryOne } from '@/lib/server/db';
import { NUTRIMAX_READ_CACHE_TAG } from '@/lib/server/read-cache';

export type { DashboardStats, DashboardRecentClient };

const emptyStats: DashboardStats = {
  clientsCount: 0,
  dietsCount: 0,
  activeAssignmentsCount: 0,
  mealPlansCount: 0,
  foodsCount: 0,
};

function toIso(d: unknown): string {
  if (d instanceof Date) return d.toISOString();
  const s = String(d ?? '');
  return s.length > 0 ? s : new Date(0).toISOString();
}

async function fetchDashboardHomeDataUncached(): Promise<{
  stats: DashboardStats;
  recentClients: DashboardRecentClient[];
}> {
  try {
    /* Single round-trip: CTEs compute all counts and recent clients in one query.
     * The first row contains the aggregated counts; the rest are recent clients. */
    type StatsRow = {
      clients_count: string;
      diets_count: string;
      active_assignments_count: string;
      meal_plans_count: string;
      foods_count: string;
    };
    type RecentRow = { id: string; full_name: string; updated_at: Date };

    const statsRow = await dbQueryOne<StatsRow>(
      `SELECT
         (SELECT count(*) FROM clients)::text              AS clients_count,
         (SELECT count(*) FROM diets)::text                AS diets_count,
         (SELECT count(*) FROM client_diet_assignments
          WHERE status = 'active')::text                   AS active_assignments_count,
         (SELECT count(*) FROM meal_plans)::text           AS meal_plans_count,
         (SELECT count(*) FROM foods)::text                AS foods_count`,
    );

    const recentRows = await dbQuery<RecentRow>(
      `SELECT id, full_name, updated_at FROM clients ORDER BY updated_at DESC LIMIT 6`,
    );

    const stats: DashboardStats = {
      clientsCount: Number(statsRow?.clients_count ?? 0),
      dietsCount: Number(statsRow?.diets_count ?? 0),
      activeAssignmentsCount: Number(statsRow?.active_assignments_count ?? 0),
      mealPlansCount: Number(statsRow?.meal_plans_count ?? 0),
      foodsCount: Number(statsRow?.foods_count ?? 0),
    };

    const recentClients: DashboardRecentClient[] = recentRows.map((r) => ({
      id: String(r.id),
      full_name: String(r.full_name),
      updated_at: toIso(r.updated_at),
    }));

    return { stats, recentClients };
  } catch {
    return { stats: emptyStats, recentClients: [] };
  }
}

/**
 * Datos del panel de inicio cacheados en el Data Cache de Next (ideal para Vercel / region warm).
 * Se invalida con `revalidateNutrimaxReadCaches()` tras mutaciones.
 */
export const getDashboardHomeData = unstable_cache(fetchDashboardHomeDataUncached, ['nutrimax-dashboard-home'], {
  revalidate: 180,
  tags: [NUTRIMAX_READ_CACHE_TAG],
});
