'use client';

import { Toaster } from 'sonner';
import { GlobalLoadingBar } from '@/components/GlobalLoadingBar';
import { ThemeProvider, useTheme } from '@/components/theme/ThemeProvider';

function ToasterWithTheme() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="top-center"
      richColors
      theme={resolvedTheme}
      closeButton
      toastOptions={{ classNames: { toast: 'font-sans' } }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <GlobalLoadingBar />
      {children}
      <ToasterWithTheme />
    </ThemeProvider>
  );
}
