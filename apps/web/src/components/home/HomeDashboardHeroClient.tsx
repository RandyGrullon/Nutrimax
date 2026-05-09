'use client';

import { ArrowRight } from 'lucide-react';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';
import { Button } from '@/components/ui/Button';

export function HomeDashboardHeroClient() {
  return (
    <div className="flex shrink-0 flex-col gap-2 self-start sm:flex-row sm:items-center">
      <PwaInstallButton variant="secondary" className="w-full sm:w-auto" />
      <Button href="/clients/new" variant="primary" className="gap-2">
        Nuevo paciente
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}
