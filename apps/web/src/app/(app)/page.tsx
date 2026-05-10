import { createClient } from '@/lib/supabase/server';
import { HomeDashboard } from '@/components/home/HomeDashboard';
import { getDashboardHomeData } from '@/lib/server/dashboard-stats';

/**
 * HomePage como Componente de Servidor (Async).
 * Al usar HomeDashboard también como RSC, eliminamos el salto de serialización
 * que causaba el fallo de Webpack «Cannot read properties of undefined (reading 'call')».
 */
export default async function HomePage() {
  const supabase = await createClient();
  
  // Obtenemos sesión y estadísticas en paralelo para optimizar el TTFB.
  const [sessionResponse, dashboard] = await Promise.all([
    supabase.auth.getSession(),
    getDashboardHomeData(),
  ]);

  const user = sessionResponse.data.session?.user;
  const userProps = user ? { email: user.email ?? null } : null;

  return (
    <HomeDashboard 
      user={userProps} 
      stats={dashboard.stats} 
      recentClients={dashboard.recentClients} 
    />
  );
}
