'use client';

import { LogOutButton } from '@/components/LogOutButton';
import { NavRoutePrefetcher } from '@/components/layout/NavRoutePrefetcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';

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
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 dark:border-white/[0.06]">
        <div className="mx-auto flex h-[3.25rem] max-w-6xl items-center justify-between gap-4 px-4">
          {navLeading}
          <div className="flex shrink-0 items-center gap-2">
            <PwaInstallButton variant="secondary" compact />
            <ThemeToggle />
            <LogOutButton />
          </div>
        </div>
        {navMobile}
      </header>
      <div
        className="relative flex min-h-0 flex-1 flex-col bg-background nb-surface-glow"
        suppressHydrationWarning
      >
        <NavRoutePrefetcher />
        <div className="flex-1">{children}</div>
      </div>
    </>
  );
}
