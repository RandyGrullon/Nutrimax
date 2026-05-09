import { createClient } from '@/lib/supabase/server';
import { HomeDashboardGate } from '@/components/home/HomeDashboardGate';
import { getDashboardHomeData } from '@/lib/server/dashboard-stats';

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: auth }, dashboard] = await Promise.all([supabase.auth.getUser(), getDashboardHomeData()]);

  const userProps = auth.user ? { email: auth.user.email ?? null } : null;

  return (
    <HomeDashboardGate user={userProps} stats={dashboard.stats} recentClients={dashboard.recentClients} />
  );
}
