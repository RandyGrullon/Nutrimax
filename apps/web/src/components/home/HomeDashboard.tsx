import Link from 'next/link';
import {
  ArrowRight,
  ClipboardList,
  LayoutDashboard,
  Link2,
  Sparkles,
  UserPlus,
  UtensilsCrossed,
} from 'lucide-react';
import type { DashboardStats } from '@/lib/server/dashboard-stats';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';
import { HelpInfoButton } from '@/components/ui/HelpInfoButton';

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/90 p-4 shadow-card backdrop-blur-sm dark:border-white/[0.06] dark:bg-card/60 dark:shadow-card-dark">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function HomeDashboard({
  user,
  stats,
}: {
  user: { email?: string | null } | null;
  stats: DashboardStats;
}) {
  const email = user?.email;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="mb-10 rounded-2xl border border-border/70 bg-gradient-to-br from-brand-600/[0.12] via-violet-600/[0.05] to-background p-6 shadow-card dark:border-white/[0.06] dark:from-brand-500/15 dark:via-violet-600/10 dark:shadow-card-dark sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex flex-wrap items-center gap-2 rounded-full border border-border/70 bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground dark:border-white/[0.08]">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" aria-hidden />
              Panel NutriMax
              <HelpInfoButton title="Este panel" label="panel de inicio" triggerClassName="p-0.5">
                <p>
                  Aquí ves un <strong className="text-foreground">resumen</strong>: cuántos pacientes hay, cuántas dietas
                  en la biblioteca y cuántas asignaciones activas (planes dados a pacientes).
                </p>
                <p>
                  Más abajo, <strong className="text-foreground">Accesos rápidos</strong> son enlaces directos a pacientes,
                  crear uno nuevo o gestionar dietas.
                </p>
                <p className="text-xs">
                  El correo bajo «Sesión» confirma con qué usuario entraste. Para cerrar sesión usa el botón arriba a la
                  derecha.
                </p>
              </HelpInfoButton>
            </div>
            <h1 className="text-2xl font-normal tracking-tight text-foreground sm:text-[1.75rem]">
              Hola{email ? `, ${email.split('@')[0]}` : ''}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Gestiona pacientes, dietas y asignaciones desde un solo lugar. Los datos se guardan en tu base
              conectada a Supabase.
            </p>
            {email ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Sesión: <span className="font-medium text-foreground">{email}</span>
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col gap-2 self-start sm:flex-row sm:items-center">
            <PwaInstallButton variant="secondary" className="w-full sm:w-auto" />
            <Button href="/clients/new" variant="primary" className="gap-2">
              Nuevo paciente
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <StatCard label="Pacientes" value={stats.clientsCount} hint="Registros en la base" />
          <StatCard label="Dietas" value={stats.dietsCount} hint="Planes en biblioteca" />
          <StatCard
            label="Asignaciones activas"
            value={stats.activeAssignmentsCount}
            hint="Dietas en curso"
          />
        </div>
      </section>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Accesos rápidos
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/clients" className="group block rounded-2xl transition hover:opacity-[0.98]">
          <Card className="h-full border-border/70 p-0 transition group-hover:border-brand-500/35 dark:border-white/[0.06]">
            <CardHeader className="p-5 pb-2">
              <LayoutDashboard
                className="mb-2 h-9 w-9 text-brand-500 transition group-hover:scale-105"
                aria-hidden
              />
              <CardTitle className="text-base">Pacientes</CardTitle>
              <CardDescription>Listado, fichas y asistente de registro.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-5 pb-5 pt-0">
              <span className="text-sm font-medium text-brand-500">Abrir</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/clients/new" className="group block rounded-2xl transition hover:opacity-[0.98]">
          <Card className="h-full border-border/70 p-0 transition group-hover:border-brand-500/35 dark:border-white/[0.06]">
            <CardHeader className="p-5 pb-2">
              <UserPlus
                className="mb-2 h-9 w-9 text-brand-500 transition group-hover:scale-105"
                aria-hidden
              />
              <CardTitle className="text-base">Nuevo paciente</CardTitle>
              <CardDescription>Asistente guiado en 9 pasos con métricas en vivo.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-5 pb-5 pt-0">
              <span className="text-sm font-medium text-brand-500">Abrir</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/diets" className="group block rounded-2xl transition hover:opacity-[0.98] sm:col-span-2 lg:col-span-1">
          <Card className="h-full border-border/70 p-0 transition group-hover:border-brand-500/35 dark:border-white/[0.06]">
            <CardHeader className="p-5 pb-2">
              <UtensilsCrossed
                className="mb-2 h-9 w-9 text-brand-500 transition group-hover:scale-105"
                aria-hidden
              />
              <CardTitle className="text-base">Dietas</CardTitle>
              <CardDescription>Crea planes y asígnalos desde la ficha del paciente.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-5 pb-5 pt-0">
              <span className="text-sm font-medium text-brand-500">Abrir</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-10 grid gap-4 border-t border-border/60 pt-8 dark:border-white/[0.06] sm:grid-cols-2">
        <div className="flex gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/25 p-4 dark:border-white/[0.08]">
          <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">Flujo sugerido</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crea dietas en la biblioteca, registra pacientes y asigna planes desde la ficha con notas.
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/25 p-4 dark:border-white/[0.08]">
          <Link2 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">Sesión estable</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Si ves avisos de sesión, vuelve a entrar desde la pantalla de login; el token se renueva al
              navegar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
