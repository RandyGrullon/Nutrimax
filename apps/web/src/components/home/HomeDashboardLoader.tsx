import { getDashboardHomeData } from '@/lib/server/dashboard-stats';
import { HomeDashboard } from '@/components/home/HomeDashboard';

export async function HomeDashboardLoader({
  user,
}: {
  user: { email?: string | null } | null;
}) {
  const { stats, recentClients } = await getDashboardHomeData();
  return <HomeDashboard user={user} stats={stats} recentClients={recentClients} />;
}
