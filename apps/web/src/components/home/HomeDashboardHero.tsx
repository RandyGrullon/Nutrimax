'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, Sparkles, Zap, Users, UtensilsCrossed, 
  Link2, Salad, Apple, UserPlus, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';
import { HelpInfoButton } from '@/components/ui/HelpInfoButton';
import type { DashboardStats } from '@/lib/dashboard-stats-types';
import { cn } from '@/lib/cn';

/**
 * CONSOLIDACIÓN TOTAL:
 * Agrupamos todas las piezas interactivas en un solo componente de cliente.
 * Esto elimina los fallos de resolución de Webpack (reading 'call') al evitar
 * que el servidor tenga que coordinar múltiples micro-módulos de cliente.
 */

function StatCard({ icon: Icon, label, value, hint, className }: any) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-4 shadow-card backdrop-blur-sm dark:border-white/[0.06] dark:bg-card/70',
      className
    )}>
      <div className="relative flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/12 text-brand-700 dark:bg-brand-500/18 dark:text-brand-300">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{value}</p>
          <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  );
}

export function HomeDashboardHero({ 
  email, 
  displayName, 
  stats 
}: { 
  email: string | null; 
  displayName: string | null;
  stats: DashboardStats;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="h-[400px] w-full animate-pulse rounded-3xl bg-muted/10" />;
  }

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            Panel NutriMax
            <HelpInfoButton title="Información" label="ayuda" triggerClassName="p-0.5">
              <p>Resumen de pacientes, dietas y catálogo nutricional.</p>
            </HelpInfoButton>
          </div>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {displayName ? <>Hola, <span className="text-brand-700 dark:text-brand-300">{displayName}</span></> : 'Bienvenido'}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Tu centro de trabajo nutricional.</p>
          {email && (
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> Sesión: {email}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <PwaInstallButton variant="secondary" compact />
          <Button href="/clients/new" variant="primary" className="gap-2">
            Nuevo paciente <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Users} label="Pacientes" value={stats.clientsCount} hint="Registros" />
        <StatCard icon={UtensilsCrossed} label="Dietas" value={stats.dietsCount} hint="Biblioteca" />
        <StatCard icon={Link2} label="Asignaciones" value={stats.activeAssignmentsCount} hint="En curso" />
        <StatCard icon={Salad} label="Planes" value={stats.mealPlansCount} hint="Catálogo" />
        <StatCard icon={Apple} label="Alimentos" value={stats.foodsCount} hint="Catálogo" />
      </div>
    </>
  );
}
