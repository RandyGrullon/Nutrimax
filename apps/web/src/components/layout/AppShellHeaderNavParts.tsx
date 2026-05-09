import Link from 'next/link';
import { APP_SHELL_NAV } from '@/config/app-shell-nav';
import { getShellPathname } from '@/lib/server/shell-pathname';
import { cn } from '@/lib/cn';

/** Logo + nav escritorio (solo servidor → sin boundary cliente en este árbol). */
export async function AppShellNavLeading() {
  const pathForActive = await getShellPathname();

  return (
    <div className="flex min-w-0 items-center gap-5">
      <Link
        href="/"
        prefetch
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
        })}
      </nav>
    </div>
  );
}

/** Nav móvil (solo servidor). */
export async function AppShellNavMobile() {
  const pathForActive = await getShellPathname();

  return (
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
      })}
    </nav>
  );
}
