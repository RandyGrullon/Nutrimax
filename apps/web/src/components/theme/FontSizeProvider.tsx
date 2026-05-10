'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'nutrimax-font-size';

export type FontSizePreference = 'small' | 'medium' | 'large' | 'extra-large';

const FONT_SIZES: Record<FontSizePreference, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
  'extra-large': '20px',
};

type FontSizeContextValue = {
  fontSize: FontSizePreference;
  setFontSize: (p: FontSizePreference) => void;
};

const FontSizeContext = createContext<FontSizeContextValue | null>(null);

function readStoredFontSize(): FontSizePreference {
  if (typeof window === 'undefined') return 'medium';
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'small' || raw === 'medium' || raw === 'large' || raw === 'extra-large') return raw;
  return 'medium';
}

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSizePreference>('medium');

  useLayoutEffect(() => {
    const stored = readStoredFontSize();
    setFontSizeState(stored);
    document.documentElement.style.fontSize = FONT_SIZES[stored];
  }, []);

  useLayoutEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[fontSize];
  }, [fontSize]);

  const setFontSize = useCallback((p: FontSizePreference) => {
    setFontSizeState(p);
    window.localStorage.setItem(STORAGE_KEY, p);
  }, []);

  const value = useMemo(() => ({ fontSize, setFontSize }), [fontSize, setFontSize]);

  return <FontSizeContext.Provider value={value}>{children}</FontSizeContext.Provider>;
}

export function useFontSize(): FontSizeContextValue {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error('useFontSize debe usarse dentro de FontSizeProvider');
  return ctx;
}
