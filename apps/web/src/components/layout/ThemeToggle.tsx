'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from '@/components/theme/ThemeProvider';
import { cn } from '@/lib/cn';

function ariaPressed(preference: ThemePreference, resolvedDark: boolean): boolean {
  if (preference === 'dark') return true;
  if (preference === 'light') return false;
  return resolvedDark;
}

const LABELS: Record<string, string> = {
  system: 'Tema: según sistema. Clic para fijar claro.',
  light: 'Tema claro. Clic para oscuro.',
  dark: 'Tema oscuro. Clic para según sistema.',
};

export function ThemeToggle({ className }: { className?: string }) {
  const { preference, cycleTheme, resolvedTheme, isReady } = useTheme();

  const Icon = preference === 'system' ? Monitor : preference === 'dark' ? Moon : Sun;
  const pressed = ariaPressed(preference, resolvedTheme === 'dark');
  /** Evita mismatch SSR/cliente: no fijar aria-pressed hasta montar; luego usar strings explícitos. */
  const ariaPressedAttr: 'true' | 'false' | undefined = isReady
    ? pressed
      ? 'true'
      : 'false'
    : undefined;

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-card transition hover:bg-muted hover:text-foreground dark:shadow-card-dark',
        className,
      )}
      aria-pressed={ariaPressedAttr}
      aria-label={LABELS[preference] ?? 'Cambiar tema'}
      title={LABELS[preference]}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}
