'use client';

import { Users, UtensilsCrossed, Link2, Salad, Apple } from 'lucide-react';
import type { DashboardStats } from '@/lib/dashboard-stats-types';
import { cn } from '@/lib/cn';

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  className,
}: {
  icon: any;
  label: string;
  value: number;
  hint: string;
  className?: string;
}) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-4 shadow-card backdrop-blur-sm dark:border-white/[0.06] dark:bg-card/70 dark:shadow-card-dark',
      className
    )}>
      <div className="relative flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/12 text-brand-700 dark:bg-brand-500/18 dark:text-brand-300">
          <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
          <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  );
}

export function HomeStats({ stats }: { stats: DashboardStats }) {
  return (
    <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard icon={Users} label="Pacientes" value={stats.clientsCount} hint="Registros en la base" className="xl:col-span-1" />
      <StatCard icon={UtensilsCrossed} label="Dietas" value={stats.dietsCount} hint="Planes en biblioteca" />
      <StatCard icon={Link2} label="Asignaciones" value={stats.activeAssignmentsCount} hint="Dietas en curso" />
      <StatCard icon={Salad} label="Planes" value={stats.mealPlansCount} hint="Plantillas en catálogo" />
      <StatCard icon={Apple} label="Alimentos" value={stats.foodsCount} hint="Ítems del catálogo" className="sm:col-span-2 xl:col-span-1" />
    </div>
  );
}
