'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { HelpInfoButton } from '@/components/ui/HelpInfoButton';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { parseApiError, showErrorToast, showSuccessToast } from '@/lib/errors';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/cn';

export type ProgressSnapshotDTO = {
  id: string;
  recorded_at: string;
  period_month: string | null;
  weight_kg: number | null;
  waist_cm: number | null;
  body_fat_pct: number | null;
  note: string;
};

function parseNum(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function mapProgressRow(row: Record<string, unknown>): ProgressSnapshotDTO {
  return {
    id: String(row.id),
    recorded_at:
      row.recorded_at instanceof Date
        ? row.recorded_at.toISOString().slice(0, 10)
        : String(row.recorded_at ?? '').slice(0, 10),
    period_month: row.period_month != null ? String(row.period_month) : null,
    weight_kg: parseNum(row.weight_kg),
    waist_cm: parseNum(row.waist_cm),
    body_fat_pct: parseNum(row.body_fat_pct),
    note: String(row.note ?? ''),
  };
}

function LineChartSvg({
  points,
  label,
  unit,
  color,
}: {
  points: { x: string; y: number }[];
  label: string;
  unit: string;
  color: string;
}) {
  if (points.length === 0) {
    return <p className="text-xs text-muted-foreground">Sin datos para {label}.</p>;
  }
  if (points.length === 1) {
    return (
      <p className="text-xs text-muted-foreground">
        Un solo dato ({label}: {points[0].y.toFixed(1)} {unit}). Añade otro registro para ver la tendencia.
      </p>
    );
  }
  const vals = points.map((p) => p.y);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const pad = 28;
  const w = 400;
  const h = 140;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const range = max - min || 1;
  const n = points.length;
  const scaleX = (i: number) => pad + (i / Math.max(1, n - 1)) * innerW;
  const scaleY = (v: number) => pad + innerH - ((v - min) / range) * innerH;
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i).toFixed(1)} ${scaleY(p.y).toFixed(1)}`).join(' ');

  return (
    <figure className="w-full">
      <figcaption className="mb-2 text-xs font-medium text-muted-foreground">
        {label} ({unit})
      </figcaption>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className={cn('w-full max-w-full overflow-visible', color)}
        role="img"
        aria-label={`Gráfico de ${label}`}
      >
        <title>{`${label} en el tiempo`}</title>
        <desc>{points.map((p) => `${p.x}: ${p.y}`).join('; ')}</desc>
        <line
          x1={pad}
          y1={pad + innerH}
          x2={pad + innerW}
          y2={pad + innerH}
          stroke="currentColor"
          className="opacity-30"
          strokeWidth={1}
        />
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle key={p.x + String(i)} cx={scaleX(i)} cy={scaleY(p.y)} r={3.5} fill="currentColor" />
        ))}
        <text x={pad} y={h - 6} fill="currentColor" className="opacity-70" style={{ fontSize: 10 }}>
          {points[0]?.x} → {points[points.length - 1]?.x}
        </text>
      </svg>
    </figure>
  );
}

function AddProgressDialog({
  clientId,
  open,
  onClose,
}: {
  clientId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [recordedAt, setRecordedAt] = useState(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  });
  const [periodMonth, setPeriodMonth] = useState(() => recordedAt.slice(0, 7));
  const [weightKg, setWeightKg] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (recordedAt.length >= 7) setPeriodMonth(recordedAt.slice(0, 7));
  }, [recordedAt, open]);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch(`/clients/${clientId}/progress`, {
        method: 'POST',
        body: JSON.stringify({
          recorded_at: recordedAt,
          period_month: periodMonth.trim() || undefined,
          weight_kg: weightKg.trim() === '' ? undefined : Number(weightKg),
          waist_cm: waistCm.trim() === '' ? undefined : Number(waistCm),
          body_fat_pct: bodyFat.trim() === '' ? undefined : Number(bodyFat),
          note: note.trim(),
        }),
      });
      if (!res.ok) {
        showErrorToast(await parseApiError(res));
        return;
      }
      showSuccessToast('Seguimiento registrado. Aparece en el historial y en los gráficos.');
      setNote('');
      setWeightKg('');
      setWaistCm('');
      setBodyFat('');
      onClose();
      router.refresh();
    } catch {
      showErrorToast('No pudimos guardar el seguimiento.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={() => !loading && onClose()}
    >
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="progress-dialog-title" className="text-lg font-semibold text-foreground">
          Registrar mejora / seguimiento
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ideal para control mensual: peso, cintura y % grasa. Se guarda en el historial con el mes de referencia.
        </p>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            Fecha del registro
            <Input type="date" value={recordedAt} onChange={(e) => setRecordedAt(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            Mes de referencia (AAAA-MM)
            <Input
              value={periodMonth}
              onChange={(e) => setPeriodMonth(e.target.value)}
              placeholder="2026-05"
              pattern="\d{4}-\d{2}"
              required
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
              Peso (kg)
              <Input type="number" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
              Cintura (cm)
              <Input type="number" step="0.1" value={waistCm} onChange={(e) => setWaistCm(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
              % grasa
              <Input type="number" step="0.1" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">Al menos uno de los tres valores anteriores es obligatorio.</p>
          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            Observación / mejora percibida *
            <Textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} required placeholder="Ej. mejor adherencia, menos hinchazón…" />
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ClientStatisticsSection({
  clientId,
  snapshots,
  heightCm,
}: {
  clientId: string;
  snapshots: ProgressSnapshotDTO[];
  heightCm: number | null;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const weightSeries = useMemo(() => {
    return snapshots
      .filter((s) => s.weight_kg != null)
      .map((s) => ({ x: s.period_month ?? s.recorded_at, y: s.weight_kg as number }));
  }, [snapshots]);

  const waistSeries = useMemo(() => {
    return snapshots
      .filter((s) => s.waist_cm != null)
      .map((s) => ({ x: s.period_month ?? s.recorded_at, y: s.waist_cm as number }));
  }, [snapshots]);

  const fatSeries = useMemo(() => {
    return snapshots
      .filter((s) => s.body_fat_pct != null)
      .map((s) => ({ x: s.period_month ?? s.recorded_at, y: s.body_fat_pct as number }));
  }, [snapshots]);

  const bmiSeries = useMemo(() => {
    if (heightCm == null || heightCm <= 0) return [];
    const hm = heightCm / 100;
    return snapshots
      .filter((s) => s.weight_kg != null)
      .map((s) => ({
        x: s.period_month ?? s.recorded_at,
        y: (s.weight_kg as number) / (hm * hm),
      }));
  }, [snapshots, heightCm]);

  const summary = useMemo(() => {
    if (weightSeries.length < 2) return null;
    const first = weightSeries[0].y;
    const last = weightSeries[weightSeries.length - 1].y;
    const delta = last - first;
    return { first, last, delta };
  }, [weightSeries]);

  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm dark:border-white/[0.07]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-start gap-2">
          <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
          <div>
            <h2 className="text-base font-semibold text-foreground">Estadísticas y seguimiento</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Registros puntuales para ver evolución mensual. Cada alta genera un evento en el historial.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HelpInfoButton title="Seguimiento del paciente" label="estadísticas seguimiento" triggerClassName="p-1.5">
            <p>
              Usa <strong className="text-foreground">Registrar mejora</strong> tras valoraciones periódicas. Los gráficos
              usan el mes de referencia en el eje; el IMC se estima con el peso registrado y la talla actual de la ficha.
            </p>
          </HelpInfoButton>
          <Button type="button" variant="primary" className="gap-2" onClick={() => setDialogOpen(true)}>
            Registrar mejora
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4 dark:border-white/[0.06]">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumen peso</h3>
          {summary ? (
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Primer registro</dt>
                <dd className="tabular-nums font-medium">{summary.first.toFixed(1)} kg</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Último registro</dt>
                <dd className="tabular-nums font-medium">{summary.last.toFixed(1)} kg</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Variación</dt>
                <dd
                  className={cn(
                    'tabular-nums font-semibold',
                    summary.delta <= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-400',
                  )}
                >
                  {summary.delta > 0 ? '+' : ''}
                  {summary.delta.toFixed(1)} kg
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Con al menos dos registros de peso verás variación y tendencia.
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4 dark:border-white/[0.06]">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registros</h3>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{snapshots.length}</p>
          <p className="text-xs text-muted-foreground">Entradas de seguimiento guardadas</p>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <LineChartSvg points={weightSeries} label="Peso" unit="kg" color="text-brand-600 dark:text-brand-400" />
        <LineChartSvg points={waistSeries} label="Cintura" unit="cm" color="text-violet-600 dark:text-violet-400" />
        <LineChartSvg points={bmiSeries} label="IMC (estimado)" unit="kg/m²" color="text-teal-600 dark:text-teal-400" />
        <LineChartSvg points={fatSeries} label="% grasa corporal" unit="%" color="text-orange-600 dark:text-orange-400" />
      </div>

      <AddProgressDialog clientId={clientId} open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </section>
  );
}
