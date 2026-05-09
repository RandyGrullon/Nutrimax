'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const { preference, cycleTheme, resolvedTheme } = useTheme();

  /**
   * Nunca usar `isReady` / useLayoutEffect del padre para el primer paint: en algunos entornos puede
   * activarse antes de terminar la hidratación y mostrar `system`/Monitor frente al HTML del servidor.
   * Solo `useEffect` garantiza que este código corre después de hidratar (mismo marcador en servidor y primer cliente).
   */
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const safePreference: ThemePreference = hydrated ? preference : 'dark';
  const safeResolvedDark = hydrated ? resolvedTheme === 'dark' : true;

  const Icon = safePreference === 'system' ? Monitor : safePreference === 'dark' ? Moon : Sun;
  const pressed = ariaPressed(safePreference, safeResolvedDark);
  const ariaPressedAttr: 'true' | 'false' | undefined = hydrated ? (pressed ? 'true' : 'false') : undefined;

  const label = LABELS[safePreference] ?? 'Cambiar tema';

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-card transition hover:bg-muted hover:text-foreground dark:shadow-card-dark',
        className,
      )}
      aria-pressed={ariaPressedAttr}
      aria-label={label}
      title={label}
      suppressHydrationWarning
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}
