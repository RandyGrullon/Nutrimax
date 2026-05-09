import type { DashboardRecentClient, DashboardStats } from '@/lib/dashboard-stats-types';
import { dbQuery, dbQueryOne } from '@/lib/server/db';

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

/** Datos agregados y recientes para el panel de inicio (conexión DB del servidor). */
export async function getDashboardHomeData(): Promise<{
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
