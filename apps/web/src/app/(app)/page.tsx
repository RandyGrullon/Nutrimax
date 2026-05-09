import { createClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/lib/server/dashboard-stats';
import { HomeDashboard } from '@/components/home/HomeDashboard';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const stats = await getDashboardStats();

  const userProps = user ? { email: user.email ?? null } : null;

  return <HomeDashboard user={userProps} stats={stats} />;
}
