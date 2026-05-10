import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/server/auth';
import { getClientById, getTimeline, type ClientRow } from '@/lib/server/clients-server';
import { listAssignmentsForClient } from '@/lib/server/assignments-server';
import { listDiets } from '@/lib/server/diets-server';
import { listClientProgressSnapshots } from '@/lib/server/progress-server';
import { ClientDietPdfExportPanel } from '@/components/clients/ClientDietPdfExportPanel';
import {
  ClientDietAssignmentsPanel,
  type ClientAssignmentRow,
} from '@/components/clients/ClientDietAssignmentsPanel';
import { ClinicalProfileReadView } from '@/components/clients/ClinicalProfileReadView';
import { DeleteClientFromDetailButton } from '@/components/clients/DeleteClientFromDetailButton';
import {
  ClientStatisticsSection,
  mapProgressRow,
} from '@/components/clients/ClientStatisticsSection';
import { CmsBreadcrumb } from '@/components/cms/CmsBreadcrumb';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { HelpInfoButton } from '@/components/ui/HelpInfoButton';
import type { ClientDietPdfContext } from '@/lib/pdf/client-diet-report-model';
import { extractClinicalGoalStep2 } from '@/lib/pdf/clinical-goal-snippet';

function formatImcTwoDecimals(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return String(value ?? '');
  return n.toFixed(2);
}

function clientHeightCm(client: Pick<ClientRow, 'height_cm'>): number | null {
  const v = client.height_cm;
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  /* Fetch ALL data in parallel — no sequential dependency needed.
   * getClientById will throw ApiError(404) if not found, caught below. */
  let client: ClientRow;
  let timelineRaw: unknown[];
  let assignments: Awaited<ReturnType<typeof listAssignmentsForClient>>;
  let dietList: Awaited<ReturnType<typeof listDiets>>;
  let progressRows: Awaited<ReturnType<typeof listClientProgressSnapshots>>;

  try {
    [client, timelineRaw, assignments, dietList, progressRows] = await Promise.all([
      getClientById(id),
      getTimeline(id),
      listAssignmentsForClient(id),
      listDiets(),
      listClientProgressSnapshots(id),
    ]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const diets = dietList.map((d) => ({ id: d.id, name: d.name }));

  const derived = client.derived_metrics as Record<string, unknown> | null;
  const name = String(client.full_name);
  const email = client.email ? String(client.email) : null;

  const progressSnapshots = progressRows.map((r) => mapProgressRow(r as unknown as Record<string, unknown>));
  const heightCm = clientHeightCm(client);

  const assignmentRows: ClientAssignmentRow[] = assignments.map((a) => ({
    id: String(a.id),
    diet_id: String(a.diet_id),
    diet_name: String(a.diet_name),
    meal_plan_name: a.meal_plan_name != null ? String(a.meal_plan_name) : null,
    status: String(a.status),
    notes: a.notes != null ? String(a.notes) : null,
    starts_on: a.starts_on != null ? String(a.starts_on) : null,
    created_at: a.created_at != null ? String(a.created_at) : null,
  }));

  const timelineEvents = timelineRaw as Record<string, unknown>[];

  const clinicalGoal = extractClinicalGoalStep2(client.clinical_profile);

  const pdfContext: ClientDietPdfContext = {
    client: {
      fullName: name,
      email,
      phone: client.phone != null && String(client.phone).trim() !== '' ? String(client.phone) : null,
      age: client.age,
      sex: client.sex != null && String(client.sex).trim() !== '' ? String(client.sex) : null,
    },
    clinicalGoal,
    baseline: {
      weightKg: client.weight_kg != null ? String(client.weight_kg) : null,
      heightCm: client.height_cm != null ? String(client.height_cm) : null,
      waistCm: client.waist_cm != null ? String(client.waist_cm) : null,
      bodyFatPct: client.body_fat_pct != null ? String(client.body_fat_pct) : null,
      goalWeightKg: client.goal_weight_kg != null ? String(client.goal_weight_kg) : null,
      bmi: derived?.bmi != null ? formatImcTwoDecimals(derived.bmi) : null,
      targetKcal: derived?.targetKcal != null ? String(derived.targetKcal) : null,
    },
    heightCm,
    progressSnapshots: progressSnapshots.map((s) => ({
      recorded_at: s.recorded_at,
      period_month: s.period_month,
      weight_kg: s.weight_kg,
      waist_cm: s.waist_cm,
      body_fat_pct: s.body_fat_pct,
      note: s.note,
    })),
    assignments: assignmentRows.map((a) => ({
      id: a.id,
      diet_id: a.diet_id,
      diet_name: a.diet_name,
      meal_plan_name: a.meal_plan_name ?? null,
      status: a.status,
      starts_on: a.starts_on ?? null,
      notes: a.notes ?? null,
    })),
  };

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
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-normal tracking-tight text-foreground sm:text-[1.75rem]">{name}</h1>
            <HelpInfoButton title="Ficha del paciente" label="ficha paciente" triggerClassName="p-1.5">
              <p>
                Aquí ves todo lo guardado de esta persona: datos del asistente, historial y dietas.{' '}
                <strong className="text-foreground">Editar ficha completa</strong> vuelve al asistente de 9 pasos.
              </p>
              <p className="text-xs">
                Puedes <strong className="text-foreground">eliminar el paciente</strong> desde esta misma cabecera (con
                confirmación). El bloque de dietas permite asignar planes de la biblioteca.
              </p>
            </HelpInfoButton>
          </div>
          {email ? (
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/90">Email:</span> {email}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Sin email registrado</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button href="/clients" variant="secondary">
            Volver al listado
          </Button>
          <Button href={`/clients/${id}/edit`} variant="primary">
            Editar ficha completa
          </Button>
          <DeleteClientFromDetailButton clientId={id} fullName={name} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {derived && Object.keys(derived).length > 0 ? (
            <section className="rounded-2xl border border-brand-500/20 bg-brand-600/[0.06] p-5 dark:border-brand-400/25 dark:bg-brand-500/[0.08]">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-brand-700 dark:text-brand-300">
                  Métricas derivadas
                </h2>
                <HelpInfoButton title="Métricas derivadas" label="métricas derivadas" triggerClassName="p-1">
                  <p>
                    Valores calculados a partir del peso, talla, objetivo y perfil (por ejemplo IMC y calorías
                    orientativas). Son una <strong className="text-foreground">guía</strong>, no sustituyen el criterio
                    profesional.
                  </p>
                </HelpInfoButton>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {derived.bmi != null ? (
                  <>
                    <dt className="text-xs font-medium text-muted-foreground">IMC</dt>
                    <dd className="text-sm font-medium text-foreground">{formatImcTwoDecimals(derived.bmi)}</dd>
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

          <ClientStatisticsSection clientId={id} snapshots={progressSnapshots} heightCm={heightCm} />

          <Card className="overflow-hidden p-0">
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border bg-muted/20 px-5 py-4">
              <div>
                <CardTitle className="text-base">Perfil clínico</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Resumen estructurado de lo registrado en el asistente (9 pasos).
                </p>
              </div>
              <HelpInfoButton title="Perfil clínico" label="perfil clínico" triggerClassName="p-1.5 shrink-0">
                <p>
                  Los datos se agrupan por bloques (objetivo, clínica, hábitos, actividad, etc.) para una lectura rápida
                  en consulta.
                </p>
                <p className="text-xs">
                  Para modificar respuestas usa <strong className="text-foreground">Editar ficha completa</strong>.
                </p>
              </HelpInfoButton>
            </CardHeader>
            <CardContent className="p-5">
              <ClinicalProfileReadView clinicalProfile={client.clinical_profile} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden p-0">
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border bg-muted/20 px-5 py-4">
              <CardTitle className="text-base">Historial de eventos</CardTitle>
              <HelpInfoButton title="Historial" label="historial eventos" triggerClassName="p-1.5">
                <p>
                  Incluye dietas, cambios de perfil y{' '}
                  <strong className="text-foreground">seguimientos mensuales</strong> registrados desde Estadísticas.
                </p>
              </HelpInfoButton>
            </CardHeader>
            <CardContent className="p-5">
              <ul className="flex flex-col gap-2">
                {timelineEvents.map((ev) => {
                  const isProgress = String(ev.type) === 'progress_monthly';
                  return (
                    <li
                      key={String(ev.id)}
                      className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm shadow-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {isProgress ? (
                          <span className="rounded-md bg-brand-600/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-800 dark:bg-brand-500/20 dark:text-brand-200">
                            Seguimiento
                          </span>
                        ) : null}
                        <span className="font-medium text-foreground">{String(ev.title)}</span>
                        <time className="text-xs tabular-nums text-muted-foreground">{String(ev.created_at)}</time>
                      </div>
                      {ev.body ? (
                        <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{String(ev.body)}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              {timelineEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin eventos en el historial.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden p-0">
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border bg-muted/20 px-5 py-4">
              <CardTitle className="text-base">Dietas y asignaciones</CardTitle>
              <HelpInfoButton title="Dietas del paciente" label="dietas asignaciones" triggerClassName="p-1.5">
                <p>
                  Pulsa <strong className="text-foreground">asignar</strong> para buscar planes: los que ya están activos
                  aparecen bloqueados. <strong className="text-foreground">Ver</strong> abre el plan en solo lectura;{' '}
                  <strong className="text-foreground">Editar plan</strong> va a la biblioteca.
                </p>
              </HelpInfoButton>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <ClientDietAssignmentsPanel clientId={id} diets={diets} assignments={assignmentRows} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden p-0">
            <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border bg-muted/20 px-5 py-4">
              <div>
                <CardTitle className="text-base">Informe PDF</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Exporta un documento para el paciente con evolución y plan alimenticio.
                </p>
              </div>
              <HelpInfoButton title="Informe PDF" label="exportar pdf dieta" triggerClassName="p-1.5 shrink-0">
                <p>
                  Elige la asignación deseada y descarga un PDF con datos de la ficha, metas, seguimiento con gráficos y el
                  contenido del plan dietético vinculado (incluye tomas del plan alimenticio cuando exista).
                </p>
              </HelpInfoButton>
            </CardHeader>
            <CardContent className="p-5">
              <ClientDietPdfExportPanel pdfContext={pdfContext} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
