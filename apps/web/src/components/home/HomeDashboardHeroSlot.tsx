'use client';

import dynamic from 'next/dynamic';

const HomeDashboardHeroClient = dynamic(
  () =>
    import('@/components/home/HomeDashboardHeroClient').then((m) => ({
      default: m.HomeDashboardHeroClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[2.75rem] shrink-0 flex-col gap-2 self-start sm:flex-row sm:items-center">
        <div className="h-10 w-full animate-pulse rounded-xl bg-muted/40 sm:w-36" aria-hidden />
        <div className="h-10 w-full animate-pulse rounded-xl bg-muted/40 sm:w-44" aria-hidden />
      </div>
    ),
  },
);

export function HomeDashboardHeroSlot() {
  return <HomeDashboardHeroClient />;
}
