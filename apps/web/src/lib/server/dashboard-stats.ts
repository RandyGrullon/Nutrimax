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
    const [clients, diets, assignsActive, mealPlans, foods, recentRows] = await Promise.all([
      dbQueryOne<{ c: string }>(`SELECT count(*)::text AS c FROM clients`),
      dbQueryOne<{ c: string }>(`SELECT count(*)::text AS c FROM diets`),
      dbQueryOne<{ c: string }>(
        `SELECT count(*)::text AS c FROM client_diet_assignments WHERE status = 'active'`,
      ),
      dbQueryOne<{ c: string }>(`SELECT count(*)::text AS c FROM meal_plans`),
      dbQueryOne<{ c: string }>(`SELECT count(*)::text AS c FROM foods`),
      dbQuery<{ id: string; full_name: string; updated_at: Date }>(
        `SELECT id, full_name, updated_at FROM clients ORDER BY updated_at DESC LIMIT 6`,
      ),
    ]);

    const stats: DashboardStats = {
      clientsCount: Number(clients?.c ?? 0),
      dietsCount: Number(diets?.c ?? 0),
      activeAssignmentsCount: Number(assignsActive?.c ?? 0),
      mealPlansCount: Number(mealPlans?.c ?? 0),
      foodsCount: Number(foods?.c ?? 0),
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
