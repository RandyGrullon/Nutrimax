'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOutButton } from '@/components/LogOutButton';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/clients', label: 'Pacientes' },
  { href: '/diets', label: 'Dietas' },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-6">
            <Link href="/" className="shrink-0 font-semibold text-foreground">
              NutriMax
            </Link>
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Principal">
              {NAV.map((item) => {
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition',
                      active
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <LogOutButton />
          </div>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 sm:hidden"
          aria-label="Principal móvil"
        >
          {NAV.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted',
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
