'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { APP_SHELL_NAV } from '@/config/app-shell-nav';

/** Rutas frecuentes fuera del nav principal (CTAs habituales). */
const EXTRA_PREFETCH_HREFS = ['/clients/new'] as const;

/**
 * Precarga los JS/RSC de las rutas principales al montar el shell para que los clics en el nav
 * se sientan instantáneos en la mayoría de los casos.
 */
export function NavRoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    for (const item of APP_SHELL_NAV) {
      router.prefetch(item.href);
    }
    for (const href of EXTRA_PREFETCH_HREFS) {
      router.prefetch(href);
    }
  }, [router]);

  return null;
}
