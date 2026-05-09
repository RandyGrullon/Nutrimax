'use client';

import { HomeDashboardHeroClient } from '@/components/home/HomeDashboardHeroClient';

/** Slot cliente del hero del dashboard (PWA + CTA). Sin `dynamic` para evitar fallos de chunk en Webpack. */
export function HomeDashboardHeroSlot() {
  return <HomeDashboardHeroClient />;
}
