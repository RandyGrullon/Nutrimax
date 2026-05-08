import { notFound } from 'next/navigation';
import { apiServerJson } from '@/lib/api-server';
import { AssignDietForm } from '@/components/AssignDietForm';
import { CmsBreadcrumb } from '@/components/cms/CmsBreadcrumb';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let client: Record<string, unknown>;
  try {
    client = await apiServerJson<Record<string, unknown>>(`/clients/${id}`);
  } catch {
    notFound();
  }

  let timeline: Array<Record<string, unknown>> = [];
  let assignments: Array<Record<string, unknown>> = [];
  let diets: Array<{ id: string; name: string }> = [];
  try {
    [timeline, assignments, diets] = await Promise.all([
      apiServerJson<Array<Record<string, unknown>>>(`/clients/${id}/timeline`),
      apiServerJson<Array<Record<string, unknown>>>(`/assignments/client/${id}`),
      apiServerJson<Array<{ id: string; name: string }>>('/diets'),
    ]);
  } catch {
    /* vacío si API falla */
  }

  const derived = client.derived_metrics as Record<string, unknown> | null;
  const name = String(client.full_name);
  const email = client.email ? String(client.email) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <CmsBreadcrumb
        className="mb-6"
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Pacientes', href: '/clients' },
          { label: name },
        ]}
      />

      <div className="mb-8 flex flex-col gap-4 border-b border-border pb-8 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{name}</h1>
          {email ? (
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/90">Email:</span> {email}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Sin email registrado</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href="/clients" variant="secondary">
            Volver al listado
          </Button>
          <Button href={`/clients/${id}/edit`} variant="primary">
            Editar ficha completa
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {derived && Object.keys(derived).length > 0 ? (
            <section className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-5 dark:border-emerald-400/20 dark:bg-emerald-950/40">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-100">
                Métricas derivadas
              </h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {derived.bmi != null ? (
                  <>
                    <dt className="text-xs font-medium text-muted-foreground">IMC</dt>
                    <dd className="text-sm font-medium text-foreground">{String(derived.bmi)}</dd>
                  </>
                ) : null}
                {derived.targetKcal != null ? (
                  <>
                    <dt className="text-xs font-medium text-muted-foreground">Objetivo kcal</dt>
                    <dd className="text-sm font-medium text-foreground">{String(derived.targetKcal)}</dd>
                  </>
                ) : null}
                {derived.waterRecommendedLiters != null ? (
                  <>
                    <dt className="text-xs font-medium text-muted-foreground">Agua (L)</dt>
                    <dd className="text-sm font-medium text-foreground">{String(derived.waterRecommendedLiters)}</dd>
                  </>
                ) : null}
              </dl>
            </section>
          ) : null}

          <Card className="overflow-hidden p-0">
            <CardHeader className="border-b border-border bg-muted/20 px-5 py-4">
              <CardTitle className="text-base">Perfil clínico (JSON)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="max-h-[min(28rem,50vh)] overflow-auto bg-muted/30 p-4 text-xs leading-relaxed text-foreground">
                {JSON.stringify(client.clinical_profile, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card className="overflow-hidden p-0">
            <CardHeader className="border-b border-border bg-muted/20 px-5 py-4">
              <CardTitle className="text-base">Historial de eventos</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <ul className="flex flex-col gap-2">
                {timeline.map((ev) => (
                  <li
                    key={String(ev.id)}
                    className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm shadow-sm"
                  >
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-medium text-foreground">{String(ev.title)}</span>
                      <time className="text-xs tabular-nums text-muted-foreground">{String(ev.created_at)}</time>
                    </div>
                    {ev.body ? <p className="mt-1 text-muted-foreground">{String(ev.body)}</p> : null}
                  </li>
                ))}
              </ul>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin eventos en el historial.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden p-0">
            <CardHeader className="border-b border-border bg-muted/20 px-5 py-4">
              <CardTitle className="text-base">Dietas y asignaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <AssignDietForm clientId={id} diets={diets} />
              <ul className="flex flex-col gap-2 border-t border-border pt-4">
                {assignments.map((a) => (
                  <li
                    key={String(a.id)}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-foreground">{String(a.diet_name)}</span>
                    <span className="shrink-0 rounded-md bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {String(a.status)}
                    </span>
                  </li>
                ))}
              </ul>
              {assignments.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin asignaciones todavía.</p>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
