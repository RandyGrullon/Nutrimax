import { AppShell } from '@/components/layout/AppShell';
import { AppShellNavLeading, AppShellNavMobile } from '@/components/layout/AppShellHeaderNavParts';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navLeading={<AppShellNavLeading />} navMobile={<AppShellNavMobile />}>
      {children}
    </AppShell>
  );
}

