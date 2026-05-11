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

/** Normaliza filas de BD o JSON al DTO usado en UI y PDF (Server y Client). */
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
