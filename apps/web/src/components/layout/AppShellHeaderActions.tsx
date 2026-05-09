'use client';

import { LogOutButton } from '@/components/LogOutButton';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export function AppShellHeaderActions() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <PwaInstallButton variant="secondary" compact />
      <ThemeToggle />
      <LogOutButton />
    </div>
  );
}
