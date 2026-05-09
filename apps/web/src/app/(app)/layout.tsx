import { AppShell } from '@/components/layout/AppShell';
import { AppShellNavLeading, AppShellNavMobile } from '@/components/layout/AppShellHeaderNavParts';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-dvh flex-col bg-background nb-surface-glow"
      suppressHydrationWarning
    >
      <AppShell navLeading={<AppShellNavLeading />} navMobile={<AppShellNavMobile />}>
        {children}
      </AppShell>
    </div>
  );
}
