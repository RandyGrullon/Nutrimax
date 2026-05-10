'use client';

import dynamic from 'next/dynamic';

/**
 * Encapsulamos los componentes problemáticos en un componente de cliente.
 * Aquí SÍ está permitido usar `ssr: false` con `next/dynamic`.
 * Esto aísla el error de Webpack «reading 'call'» del resto de la página.
 */

export const DynamicPwaInstallButton = dynamic(
  () => import('@/components/pwa/PwaInstallButton').then((m) => m.PwaInstallButton),
  {
    ssr: false,
    loading: () => <div className="h-10 w-32 animate-pulse rounded-xl bg-muted/50" />,
  }
);

export const DynamicHelpInfoButton = dynamic(
  () => import('@/components/ui/HelpInfoButton').then((m) => m.HelpInfoButton),
  {
    ssr: false,
    loading: () => <div className="h-6 w-6 animate-pulse rounded-full bg-muted/40" />,
  }
);
