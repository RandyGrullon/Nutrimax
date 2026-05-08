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
    <div className="rounded-xl border border-border bg-card/80 p-4 shadow-card backdrop-blur-sm dark:bg-card/50 dark:shadow-card-dark">
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
      <section className="mb-10 rounded-2xl border border-border bg-gradient-to-br from-brand-500/10 via-background to-background p-6 shadow-card dark:from-brand-500/15 dark:shadow-card-dark sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" aria-hidden />
              Panel NutriMax
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
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
          <Button href="/clients/new" variant="primary" className="shrink-0 gap-2 self-start">
            Nuevo paciente
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
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
          <Card className="h-full border-border/80 p-0 transition group-hover:border-brand-500/40">
            <CardHeader className="p-5 pb-2">
              <LayoutDashboard
                className="mb-2 h-9 w-9 text-brand-700 transition group-hover:scale-105 dark:text-brand-400"
                aria-hidden
              />
              <CardTitle className="text-base">Pacientes</CardTitle>
              <CardDescription>Listado, fichas y asistente de registro.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-5 pb-5 pt-0">
              <span className="text-sm font-medium text-brand-700 dark:text-brand-400">Abrir</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/clients/new" className="group block rounded-2xl transition hover:opacity-[0.98]">
          <Card className="h-full border-border/80 p-0 transition group-hover:border-brand-500/40">
            <CardHeader className="p-5 pb-2">
              <UserPlus
                className="mb-2 h-9 w-9 text-brand-700 transition group-hover:scale-105 dark:text-brand-400"
                aria-hidden
              />
              <CardTitle className="text-base">Nuevo paciente</CardTitle>
              <CardDescription>Asistente guiado en 9 pasos con métricas en vivo.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-5 pb-5 pt-0">
              <span className="text-sm font-medium text-brand-700 dark:text-brand-400">Abrir</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/diets" className="group block rounded-2xl transition hover:opacity-[0.98] sm:col-span-2 lg:col-span-1">
          <Card className="h-full border-border/80 p-0 transition group-hover:border-brand-500/40">
            <CardHeader className="p-5 pb-2">
              <UtensilsCrossed
                className="mb-2 h-9 w-9 text-brand-700 transition group-hover:scale-105 dark:text-brand-400"
                aria-hidden
              />
              <CardTitle className="text-base">Dietas</CardTitle>
              <CardDescription>Crea planes y asígnalos desde la ficha del paciente.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between px-5 pb-5 pt-0">
              <span className="text-sm font-medium text-brand-700 dark:text-brand-400">Abrir</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-10 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
        <div className="flex gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-4">
          <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <p className="text-sm font-medium text-foreground">Flujo sugerido</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Crea dietas en la biblioteca, registra pacientes y asigna planes desde la ficha con notas.
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-4">
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
