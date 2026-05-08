'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'nutrimax-theme';

export type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  resolvedTheme: 'light' | 'dark';
  /** Ciclo: system → light → dark → system */
  cycleTheme: () => void;
  /** true tras leer localStorage y prefers-color-scheme (evita desajuste de hidratación en UI de tema). */
  isReady: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [osDark, setOsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setPreferenceState(readStoredPreference());
    setOsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setOsDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme = useMemo((): 'light' | 'dark' => {
    if (preference === 'system') return osDark ? 'dark' : 'light';
    return preference;
  }, [preference, osDark]);

  useLayoutEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [mounted, resolvedTheme]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    window.localStorage.setItem(STORAGE_KEY, p);
    const next =
      p === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : p;
    document.documentElement.classList.toggle('dark', next === 'dark');
  }, []);

  const cycleTheme = useCallback(() => {
    setPreferenceState((prev) => {
      const next: ThemePreference =
        prev === 'system' ? 'light' : prev === 'light' ? 'dark' : 'system';
      window.localStorage.setItem(STORAGE_KEY, next);
      const resolved =
        next === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : next;
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ preference, setPreference, resolvedTheme, cycleTheme, isReady: mounted }),
    [preference, setPreference, resolvedTheme, cycleTheme, mounted],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
