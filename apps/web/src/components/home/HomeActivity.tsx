'use client';

import Link from 'next/link';
import { ChevronRight, LayoutDashboard, ClipboardList, CalendarClock, ArrowRight } from 'lucide-react';
import type { DashboardRecentClient } from '@/lib/dashboard-stats-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

const workflowSteps = [
  { step: 1, title: 'Nutrición', href: '/nutrition' },
  { step: 2, title: 'Dietas', href: '/diets' },
  { step: 3, title: 'Pacientes', href: '/clients' },
  { step: 4, title: 'Asignación', href: '/clients' },
] as const;

function formatRecentActivity(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch { return ''; }
}

export function HomeWorkflow() {
  return (
    <section className="rounded-3xl border border-border/70 bg-card/40 p-6 shadow-sm dark:border-white/[0.06] dark:bg-card/30">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Flujo recomendado</h2>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {workflowSteps.map((s) => (
          <li key={s.step}>
            <Link href={s.href} className="group flex h-full flex-col rounded-2xl border border-border/60 bg-background/80 p-4 transition hover:border-brand-500/35 hover:bg-brand-600/[0.04] dark:border-white/[0.07] dark:bg-background/40">
              <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600/15 text-xs font-bold text-brand-800 dark:bg-brand-500/20 dark:text-brand-200">{s.step}</span>
              <p className="text-sm font-semibold text-foreground group-hover:text-brand-700 dark:group-hover:text-brand-300">{s.title}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">Ir <ChevronRight className="h-3.5 w-3.5" /></span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function HomeActivity({ recentClients }: { recentClients: DashboardRecentClient[] }) {
  return (
    <Card className="overflow-hidden border-border/70 shadow-card dark:border-white/[0.06]">
      <CardHeader className="border-b border-border/60 bg-muted/25 px-5 py-4 dark:border-white/[0.06]">
        <CardTitle className="text-base">Actividad reciente</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {recentClients.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">Aún no hay pacientes.</div>
        ) : (
          <ul className="divide-y divide-border/60 dark:divide-white/[0.06]">
            {recentClients.map((c) => (
              <li key={c.id}>
                <Link href={`/clients/${c.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{c.full_name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{formatRecentActivity(c.updated_at)}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function HomeFooterInfo() {
  return (
    <div className="grid gap-4 border-t border-border/60 pt-8 dark:border-white/[0.06] sm:grid-cols-2">
      <div className="flex gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4">
        <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-brand-600/80" />
        <div>
          <p className="text-sm font-medium text-foreground">Seguimiento continuo</p>
          <p className="mt-1 text-xs text-muted-foreground">Registra peso, cintura y % grasa para gráficos.</p>
        </div>
      </div>
      <div className="flex gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4">
        <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-violet-600/80" />
        <div>
          <p className="text-sm font-medium text-foreground">Sesión y dispositivo</p>
          <p className="mt-1 text-xs text-muted-foreground">Instala la PWA para acceso rápido.</p>
        </div>
      </div>
    </div>
  );
}
