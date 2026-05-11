import { z } from 'zod';
import { ApiError } from '@/lib/server/auth';
import { dbQuery, dbQueryOne } from '@/lib/server/db';
import { getClientById } from '@/lib/server/clients-server';

export const progressSnapshotBodySchema = z
  .object({
    recorded_at: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (AAAA-MM-DD).')
      .optional(),
    period_month: z
      .string()
      .regex(/^\d{4}-\d{2}$/, 'Mes de referencia inválido (AAAA-MM).')
      .optional(),
    weight_kg: z.coerce.number().positive().max(500).optional(),
    waist_cm: z.coerce.number().positive().max(400).optional(),
    body_fat_pct: z.coerce.number().min(0).max(100).optional(),
    note: z
      .string()
      .trim()
      .min(5, 'Describe la mejora u observación (mín. 5 caracteres).')
      .max(2000),
  })
  .refine(
    (d) => d.weight_kg != null || d.waist_cm != null || d.body_fat_pct != null,
    {
      message: 'Indica al menos peso, cintura o % grasa para el seguimiento.',
      path: ['weight_kg'],
    },
  );

export type ProgressSnapshotRow = {
  id: string;
  client_id: string;
  recorded_at: Date;
  period_month: string | null;
  weight_kg: string | null;
  waist_cm: string | null;
  body_fat_pct: string | null;
  note: string;
  created_at: Date;
};

function defaultPeriodMonth(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function listClientProgressSnapshots(clientId: string): Promise<ProgressSnapshotRow[]> {
  if (!(await progressTableExists())) return [];
  return dbQuery<ProgressSnapshotRow>(
    `SELECT * FROM client_progress_snapshots WHERE client_id = $1 ORDER BY recorded_at ASC, created_at ASC`,
    [clientId],
  );
}

export async function addClientProgressSnapshot(
  clientId: string,
  raw: unknown,
): Promise<ProgressSnapshotRow> {
  await getClientById(clientId);
  if (!(await progressTableExists())) {
    throw new ApiError(
      503,
      'El seguimiento mensual no está disponible: ejecuta la migración de base de datos (client_progress_snapshots).',
    );
  }
  const parsed = progressSnapshotBodySchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Datos de seguimiento no válidos.';
    throw new ApiError(400, first);
  }
  const b = parsed.data;
  const recorded =
    b.recorded_at ??
    (() => {
      const t = new Date();
      return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    })();
  const period = b.period_month ?? defaultPeriodMonth(new Date(recorded + 'T12:00:00Z'));

  const rows = await dbQuery<ProgressSnapshotRow>(
    `INSERT INTO client_progress_snapshots (
        client_id, recorded_at, period_month, weight_kg, waist_cm, body_fat_pct, note
      ) VALUES ($1, $2::date, $3, $4, $5, $6, $7)
      RETURNING *`,
    [
      clientId,
      recorded,
      period,
      b.weight_kg ?? null,
      b.waist_cm ?? null,
      b.body_fat_pct ?? null,
      b.note,
    ],
  );
  const snap = rows[0];

  const title = `Seguimiento ${period}`;
  const metrics: string[] = [];
  if (b.weight_kg != null) metrics.push(`Peso ${b.weight_kg} kg`);
  if (b.waist_cm != null) metrics.push(`Cintura ${b.waist_cm} cm`);
  if (b.body_fat_pct != null) metrics.push(`% grasa ${b.body_fat_pct}%`);
  const bodyPreview = [metrics.join(' · '), b.note].filter(Boolean).join('\n');

  await dbQuery(
    `INSERT INTO client_timeline_events (client_id, type, title, body, payload)
       VALUES ($1, 'progress_monthly', $2, $3, $4::jsonb)`,
    [
      clientId,
      title,
      bodyPreview,
      JSON.stringify({
        snapshot_id: snap.id,
        recorded_at: recorded,
        period_month: period,
        weight_kg: b.weight_kg ?? null,
        waist_cm: b.waist_cm ?? null,
        body_fat_pct: b.body_fat_pct ?? null,
      }),
    ],
  );

  return snap;
}

/** Cached result: once the table exists it won't disappear, so we cache it per cold start. */
let _progressTableExistsCache: boolean | undefined;

/** Comprueba si la tabla existe (despliegues sin migración 002). Cacheado en memoria tras el primer check. */
export async function progressTableExists(): Promise<boolean> {
  if (_progressTableExistsCache === true) return true;
  const row = await dbQueryOne<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'client_progress_snapshots'
     ) AS exists`,
  );
  const exists = row?.exists === true;
  if (exists) _progressTableExistsCache = true;
  return exists;
}
