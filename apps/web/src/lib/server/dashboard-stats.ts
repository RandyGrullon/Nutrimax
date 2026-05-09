import type { DashboardStats } from '@/lib/dashboard-stats-types';
import { dbQueryOne } from '@/lib/server/db';

export type { DashboardStats };

const empty: DashboardStats = { clientsCount: 0, dietsCount: 0, activeAssignmentsCount: 0 };

/** Agregados para el panel de inicio (misma conexión DB que los route handlers; no usa JWT por HTTP). */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [clients, diets, assigns] = await Promise.all([
      dbQueryOne<{ c: string }>(`SELECT count(*)::text AS c FROM clients`),
      dbQueryOne<{ c: string }>(`SELECT count(*)::text AS c FROM diets`),
      dbQueryOne<{ c: string }>(
        `SELECT count(*)::text AS c FROM client_diet_assignments WHERE status = 'active'`,
      ),
    ]);
    return {
      clientsCount: Number(clients?.c ?? 0),
      dietsCount: Number(diets?.c ?? 0),
      activeAssignmentsCount: Number(assigns?.c ?? 0),
    };
  } catch {
    return empty;
  }
}
