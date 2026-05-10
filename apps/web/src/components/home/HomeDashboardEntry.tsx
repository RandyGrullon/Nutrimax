'use client';

import Link from 'next/link';
import {
  Apple,
  ArrowRight,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Link2,
  Salad,
  Sparkles,
  UserPlus,
  Users,
  UtensilsCrossed,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DashboardRecentClient, DashboardStats } from '@/lib/dashboard-stats-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HelpInfoButton } from '@/components/ui/HelpInfoButton';
import { cn } from '@/lib/cn';

/* ──────────────────────────────────────────────────────────────────
 * Panel de inicio en un solo módulo cliente. Lucide vía `dist/esm/icons/*`
 * (no barrel principal). La instalación PWA está en `AppShell`.
 * ────────────────────────────────────────────────────────────────── */

interface Props {
  user: { email?: string | null } | null;
  stats: DashboardStats;
  recentClients: DashboardRecentClient[];
}

function formatRecentActivity(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return '';
  }
}

function DashboardStatCard({
  icon: Icon,
  label,
  value,
  hint,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-4 shadow-card backdrop-blur-sm dark:border-white/[0.06] dark:bg-card/70 dark:shadow-card-dark',
        className,
      )}
    >
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

function QuickLinkCard({
  href,
  icon: Icon,
  title,
  description,
  className,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn('group block rounded-2xl transition hover:opacity-[0.98]', className)}>
      <Card className="h-full border-border/70 p-0 transition group-hover:border-brand-500/40 group-hover:shadow-md dark:border-white/[0.06] dark:group-hover:border-brand-400/35">
        <CardHeader className="p-5 pb-2">
          <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-muted/80 text-brand-600 ring-1 ring-border/60 transition group-hover:scale-[1.03] group-hover:bg-brand-600/10 group-hover:text-brand-700 dark:bg-white/[0.06] dark:text-brand-400 dark:ring-white/[0.08] dark:group-hover:bg-brand-500/15">
            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="leading-relaxed">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between px-5 pb-5 pt-0">
          <span className="text-sm font-medium text-brand-600 dark:text-brand-400">Abrir</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
        </CardContent>
      </Card>
    </Link>
  );
}

function HeroActions() {
  return (
    <div className="flex shrink-0 flex-col gap-2 self-start sm:flex-row sm:items-center">
      <Button href="/clients/new" variant="primary" className="gap-2">
        Nuevo paciente
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}

const workflowSteps = [
  {
    step: 1,
    title: 'Catálogo nutricional',
    body: 'Categorías, alimentos y planes alimenticios base.',
    href: '/nutrition',
  },
  {
    step: 2,
    title: 'Biblioteca de dietas',
    body: 'Define planes con macros y vincula el plan alimenticio.',
    href: '/diets',
  },
  {
    step: 3,
    title: 'Pacientes',
    body: 'Altas, perfil clínico y seguimiento con gráficos.',
    href: '/clients',
  },
  {
    step: 4,
    title: 'Asignación',
    body: 'Desde la ficha del paciente: asigna dieta y notas.',
    href: '/clients',
  },
] as const;

export function HomeDashboardEntry({ user, stats, recentClients }: Props) {
  const email = user?.email;
  const displayName = email ? email.split('@')[0] : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-brand-600/[0.11] via-background to-violet-600/[0.08] shadow-card dark:border-white/[0.07] dark:from-brand-500/[0.14] dark:via-background dark:to-violet-600/[0.12] dark:shadow-card-dark">
        <div
          className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl dark:bg-brand-400/15"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl dark:bg-violet-400/12"
          aria-hidden
        />

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex flex-wrap items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm dark:border-white/[0.1] dark:bg-black/20">
                <Sparkles className="h-3.5 w-3.5 text-brand-500 dark:text-brand-400" aria-hidden />
                Panel NutriMax
                <HelpInfoButton title="Este panel" label="panel de inicio" triggerClassName="p-0.5">
                  <p>
                    Resumen de <strong className="text-foreground">pacientes</strong>,{' '}
                    <strong className="text-foreground">dietas</strong>,{' '}
                    <strong className="text-foreground">asignaciones activas</strong> y volumen del{' '}
                    <strong className="text-foreground">catálogo nutricional</strong> (planes y alimentos).
                  </p>
                  <p>
                    <strong className="text-foreground">Accesos rápidos</strong> llevan a cada módulo; a la derecha
                    verás los pacientes con ficha actualizada recientemente.
                  </p>
                  <p className="text-xs">
                    El correo bajo «Sesión» confirma el usuario activo. Cierra sesión desde la barra superior.
                  </p>
                </HelpInfoButton>
              </div>
              <h1 className="text-[1.65rem] font-semibold tracking-tight text-foreground sm:text-3xl lg:text-[2rem]">
                {displayName ? (
                  <>
                    Hola, <span className="text-brand-700 dark:text-brand-300">{displayName}</span>
                  </>
                ) : (
                  'Bienvenido a NutriMax'
                )}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground lg:text-[15px]">
                Tu centro de trabajo: perfil clínico, planes personalizados y seguimiento en un solo flujo coherente con
                Supabase.
              </p>
              {email ? (
                <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/50 px-3 py-1.5 text-xs text-muted-foreground dark:border-white/[0.08] dark:bg-black/25">
                  <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                  Sesión: <span className="font-medium text-foreground">{email}</span>
                </p>
              ) : null}
            </div>
            <HeroActions />
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <DashboardStatCard
              icon={Users}
              label="Pacientes"
              value={stats.clientsCount}
              hint="Registros en la base"
              className="xl:col-span-1"
            />
            <DashboardStatCard
              icon={UtensilsCrossed}
              label="Dietas"
              value={stats.dietsCount}
              hint="Planes en biblioteca"
            />
            <DashboardStatCard
              icon={Link2}
              label="Asignaciones activas"
              value={stats.activeAssignmentsCount}
              hint="Dietas en curso en pacientes"
            />
            <DashboardStatCard
              icon={Salad}
              label="Planes alimenticios"
              value={stats.mealPlansCount}
              hint="Plantillas de tomas en catálogo"
            />
            <DashboardStatCard
              icon={Apple}
              label="Alimentos"
              value={stats.foodsCount}
              hint="Ítems del catálogo"
              className="sm:col-span-2 xl:col-span-1"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <LayoutDashboard className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden />
              Accesos rápidos
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <QuickLinkCard
                href="/clients"
                icon={Users}
                title="Pacientes"
                description="Listado, fichas detalladas, estadísticas y asignación de dietas."
              />
              <QuickLinkCard
                href="/clients/new"
                icon={UserPlus}
                title="Nuevo paciente"
                description="Asistente guiado en 9 pasos con métricas y perfil clínico."
              />
              <QuickLinkCard
                href="/nutrition"
                icon={Salad}
                title="Nutrición"
                description="Categorías, alimentos y planes alimenticios que alimentan las dietas."
              />
              <QuickLinkCard
                href="/diets"
                icon={UtensilsCrossed}
                title="Dietas"
                description="Biblioteca de planes: macros, instrucciones y vínculo al plan alimenticio."
              />
            </div>
          </div>

          <section className="rounded-3xl border border-border/70 bg-card/40 p-6 shadow-sm dark:border-white/[0.06] dark:bg-card/30">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Flujo recomendado
              </h2>
              <span className="text-xs text-muted-foreground">Orden sugerido para nuevas incorporaciones</span>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {workflowSteps.map((s, i) => (
                <li key={s.step}>
                  <Link
                    href={s.href}
                    className="group flex h-full flex-col rounded-2xl border border-border/60 bg-background/80 p-4 transition hover:border-brand-500/35 hover:bg-brand-600/[0.04] dark:border-white/[0.07] dark:bg-background/40 dark:hover:border-brand-400/30"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600/15 text-xs font-bold text-brand-800 dark:bg-brand-500/20 dark:text-brand-200">
                        {s.step}
                      </span>
                      {i < workflowSteps.length - 1 ? (
                        <span
                          className="hidden h-px flex-1 bg-gradient-to-r from-border to-transparent lg:block"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-brand-700 dark:group-hover:text-brand-300">
                      {s.title}
                    </p>
                    <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                      Ir
                      <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          <div className="grid gap-4 border-t border-border/60 pt-8 dark:border-white/[0.06] sm:grid-cols-2">
            <div className="flex gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4 dark:border-white/[0.1] dark:bg-muted/10">
              <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-brand-600/80 dark:text-brand-400/90" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">Seguimiento continuo</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Registra peso, cintura y % grasa desde la ficha para alimentar los gráficos y el informe PDF.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4 dark:border-white/[0.1] dark:bg-muted/10">
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-violet-600/80 dark:text-violet-400/90" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">Sesión y dispositivo</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Instala la PWA desde la barra superior para acceso rápido. Si la sesión caduca, vuelve a iniciar sesión.
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <Card className="overflow-hidden border-border/70 shadow-card dark:border-white/[0.06] dark:shadow-card-dark">
            <CardHeader className="border-b border-border/60 bg-muted/25 px-5 py-4 dark:border-white/[0.06] dark:bg-muted/15">
              <CardTitle className="text-base">Actividad reciente</CardTitle>
              <CardDescription>Pacientes con la ficha actualizada más recientemente.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {recentClients.length === 0 ? (
                <div className="p-5 text-sm text-muted-foreground">
                  <p>Aún no hay pacientes.</p>
                  <Link
                    href="/clients/new"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Crear el primero
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-border/60 dark:divide-white/[0.06]">
                  {recentClients.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/clients/${c.id}`}
                        className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-muted/40 dark:hover:bg-white/[0.04]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{c.full_name}</p>
                          <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                            {formatRecentActivity(c.updated_at)}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {recentClients.length > 0 ? (
                <div className="border-t border-border/60 px-5 py-3 dark:border-white/[0.06]">
                  <Link
                    href="/clients"
                    className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Ver todos los pacientes →
                  </Link>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
