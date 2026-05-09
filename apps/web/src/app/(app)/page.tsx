import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { HomeDashboardLoader } from '@/components/home/HomeDashboardLoader';
import { PageLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userProps = user ? { email: user.email ?? null } : null;

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
          <PageLoadingSkeleton label="Cargando panel…" />
        </div>
      }
    >
      <HomeDashboardLoader user={userProps} />
    </Suspense>
  );
}
