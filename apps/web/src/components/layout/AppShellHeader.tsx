import Link from 'next/link';
import { headers } from 'next/headers';
import { APP_SHELL_NAV } from '@/config/app-shell-nav';
import { AppShellHeaderActions } from '@/components/layout/AppShellHeaderActions';
import { cn } from '@/lib/cn';

/**
 * Cabecera y navegación como Server Component: evita desajustes de hidratación por `usePathname()`
 * en el primer paint del cliente frente al SSR.
 */
export async function AppShellHeader() {
  const h = await headers();
  const pathForActive = h.get('x-nutrimax-pathname') ?? '';

  const navLinks = APP_SHELL_NAV.map((item) => {
    const active =
      item.href === '/'
        ? pathForActive === '/'
        : pathForActive === item.href || pathForActive.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch
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
  });

  const navLinksMobile = APP_SHELL_NAV.map((item) => {
    const active =
      item.href === '/'
        ? pathForActive === '/'
        : pathForActive === item.href || pathForActive.startsWith(`${item.href}/`);
    return (
      <Link
        key={`m-${item.href}`}
        href={item.href}
        prefetch
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
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 dark:border-white/[0.06]">
      <div className="mx-auto flex h-[3.25rem] max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            href="/"
            prefetch
            className="shrink-0 text-[15px] font-medium tracking-tight text-foreground hover:text-brand-400"
          >
            NutriMax
          </Link>
          <nav className="hidden items-center gap-0.5 sm:flex" aria-label="Principal">
            {navLinks}
          </nav>
        </div>
        <AppShellHeaderActions />
      </div>
      <nav
        className="flex gap-1 overflow-x-auto border-t border-border/60 px-4 py-2 dark:border-white/[0.06] sm:hidden"
        aria-label="Principal móvil"
      >
        {navLinksMobile}
      </nav>
    </header>
  );
}
