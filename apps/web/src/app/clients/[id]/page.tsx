import Link from 'next/link';
import { notFound } from 'next/navigation';
import { apiServerJson } from '@/lib/api-server';
import { AssignDietForm } from '@/components/AssignDietForm';

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
    /* tabs can show empty if API misconfigured */
  }

  const derived = client.derived_metrics as Record<string, unknown> | null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href="/clients" className="text-sm text-brand-700 underline">
          ← Pacientes
        </Link>
        <Link
          href={`/clients/${id}/edit`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        >
          Editar perfil
        </Link>
      </div>
      <h1 className="text-2xl font-semibold text-slate-900">{String(client.full_name)}</h1>
      {client.email ? <p className="text-sm text-slate-600">{String(client.email)}</p> : null}

      {derived && Object.keys(derived).length > 0 ? (
        <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm">
          <h2 className="font-semibold text-emerald-900">Métricas guardadas</h2>
          <dl className="mt-2 grid gap-2 sm:grid-cols-2">
            {derived.bmi != null ? (
              <>
                <dt className="text-slate-600">IMC</dt>
                <dd>{String(derived.bmi)}</dd>
              </>
            ) : null}
            {derived.targetKcal != null ? (
              <>
                <dt className="text-slate-600">Objetivo kcal</dt>
                <dd>{String(derived.targetKcal)}</dd>
              </>
            ) : null}
            {derived.waterRecommendedLiters != null ? (
              <>
                <dt className="text-slate-600">Agua (L)</dt>
                <dd>{String(derived.waterRecommendedLiters)}</dd>
              </>
            ) : null}
          </dl>
        </section>
      ) : null}

      <div className="mt-8 flex flex-col gap-8">
        <section>
          <h2 className="mb-2 text-lg font-semibold">Perfil clínico</h2>
          <pre className="max-h-96 overflow-auto rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
            {JSON.stringify(client.clinical_profile, null, 2)}
          </pre>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">Historial</h2>
          <ul className="flex flex-col gap-2">
            {timeline.map((ev) => (
              <li key={String(ev.id)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="font-medium">{String(ev.title)}</span>
                <span className="ml-2 text-xs text-slate-500">{String(ev.created_at)}</span>
                {ev.body ? <p className="mt-1 text-slate-600">{String(ev.body)}</p> : null}
              </li>
            ))}
          </ul>
          {timeline.length === 0 ? <p className="text-sm text-slate-500">Sin eventos.</p> : null}
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">Dietas</h2>
          <AssignDietForm clientId={id} diets={diets} />
          <ul className="mt-4 flex flex-col gap-2">
            {assignments.map((a) => (
              <li key={String(a.id)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="font-medium">{String(a.diet_name)}</span>
                <span className="ml-2 text-xs uppercase text-slate-500">{String(a.status)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
