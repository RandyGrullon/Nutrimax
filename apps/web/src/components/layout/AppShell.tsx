'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOutButton } from '@/components/LogOutButton';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { APP_SHELL_NAV } from '@/config/app-shell-nav';
import { cn } from '@/lib/cn';

type AppShellProps = {
  children: React.ReactNode;
  /** Ruta de la petición (middleware); evita desajuste activo nav SSR vs cliente. */
  initialPathname?: string;
};

export function AppShell({ children, initialPathname = '' }: AppShellProps) {
  const pathname = usePathname();
  const pathForActive = pathname.length > 0 ? pathname : initialPathname;

  return (
    <div
      className="relative flex min-h-dvh flex-col bg-background nb-surface-glow"
      suppressHydrationWarning
    >
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 dark:border-white/[0.06]">
        <div className="mx-auto flex h-[3.25rem] max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-5">
            <Link
              href="/"
              className="shrink-0 text-[15px] font-medium tracking-tight text-foreground hover:text-brand-400"
            >
              NutriMax
            </Link>
            <nav className="hidden items-center gap-0.5 sm:flex" aria-label="Principal">
              {APP_SHELL_NAV.map((item) => {
                const active =
                  item.href === '/'
                    ? pathForActive === '/'
                    : pathForActive === item.href || pathForActive.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    suppressHydrationWarning
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                      active
                        ? 'bg-muted text-foreground shadow-sm dark:bg-white/[0.08]'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <PwaInstallButton variant="secondary" compact />
            <ThemeToggle />
            <LogOutButton />
          </div>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto border-t border-border/60 px-4 py-2 dark:border-white/[0.06] sm:hidden"
          aria-label="Principal móvil"
        >
          {APP_SHELL_NAV.map((item) => {
            const active =
              item.href === '/'
                ? pathForActive === '/'
                : pathForActive === item.href || pathForActive.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                suppressHydrationWarning
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium',
                  active
                    ? 'bg-muted text-foreground dark:bg-white/[0.08]'
                    : 'text-muted-foreground hover:bg-muted/60',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
