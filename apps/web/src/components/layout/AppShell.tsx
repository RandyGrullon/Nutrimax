'use client';

import { LogOutButton } from '@/components/LogOutButton';
import { NavRoutePrefetcher } from '@/components/layout/NavRoutePrefetcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';
import { Settings } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Shell cliente: acciones de cabecera viven aquí (mismo bundle) para evitar el fallo Webpack
 * `Cannot read properties of undefined (reading 'call')` al importar cliente dentro de RSC.
 * Los enlaces del nav se pasan como slots desde Server Components (`AppShellNavLeading` / `AppShellNavMobile`).
 */
export function AppShell({
  navLeading,
  navMobile,
  children,
}: {
  navLeading: React.ReactNode;
  navMobile: React.ReactNode;
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div
      className="relative flex min-h-dvh flex-col bg-background nb-surface-glow"
      suppressHydrationWarning
    >
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 dark:border-white/[0.06]">
        <div className="mx-auto flex h-[3.25rem] max-w-6xl items-center justify-between gap-4 px-4">
          {navLeading}
          <div className="flex shrink-0 items-center gap-2">
            <PwaInstallButton variant="secondary" compact />
            <ThemeToggle />
            <Link
              href="/settings"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/[0.1] dark:bg-white/[0.03] dark:hover:bg-white/[0.08]"
              title="Ajustes"
            >
              {hydrated ? (
                <Settings className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <div className="h-[1.2rem] w-[1.2rem]" />
              )}
              <span className="sr-only">Ajustes</span>
            </Link>
            <LogOutButton />
          </div>
        </div>
        {navMobile}
      </header>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <NavRoutePrefetcher />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
