import { AppShell } from '@/components/layout/AppShell';
import { AppShellHeader } from '@/components/layout/AppShellHeader';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-dvh flex-col bg-background nb-surface-glow"
      suppressHydrationWarning
    >
      <AppShellHeader />
      <AppShell>{children}</AppShell>
    </div>
  );
}
