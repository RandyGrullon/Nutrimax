import { createClient } from '@/lib/supabase/server';
import { getDashboardStats } from '@/lib/server/dashboard-stats';
import { HomeDashboard } from '@/components/home/HomeDashboard';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const stats = await getDashboardStats();

  return <HomeDashboard user={user} stats={stats} />;
}
