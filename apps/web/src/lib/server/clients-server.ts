import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import {
  createClientBodySchema,
  deriveAllMetrics,
  metricsInputFromClinicalAndAnthro,
  type CreateClientBody,
} from '@nutrimax/shared';
import { ApiError } from '@/lib/server/auth';
import { dbQuery, dbQueryOne } from '@/lib/server/db';
import { NUTRIMAX_READ_CACHE_TAG } from '@/lib/server/read-cache';

export interface ClientRow {
  id: string;
  created_at: Date;
  updated_at: Date;
  full_name: string;
  email: string | null;
  phone: string | null;
  age: number | null;
  sex: string | null;
  weight_kg: string | null;
  height_cm: string | null;
  body_fat_pct: string | null;
  waist_cm: string | null;
  goal_weight_kg: string | null;
  bioimpedance_report: unknown;
  derived_metrics: unknown;
  clinical_profile: unknown;
  clinical_profile_version: number;
}

function computeDerived(body: CreateClientBody): Record<string, unknown> {
  const input = metricsInputFromClinicalAndAnthro({
    age: body.age,
    sex: body.sex,
    weightKg: body.weight_kg,
    heightCm: body.height_cm,
    bodyFatPct: body.body_fat_pct,
    clinical_profile: body.clinical_profile,
  });
  return deriveAllMetrics(input, body.clinical_profile?.step2?.goal) as unknown as Record<string, unknown>;
}

async function fetchAllClientsUncached(): Promise<ClientRow[]> {
  return dbQuery<ClientRow>(`SELECT * FROM clients ORDER BY updated_at DESC`);
}

/** Una lectura por request si varias partes del árbol RSC llaman al listado (sin Data Cache). */
export const listClients = cache(fetchAllClientsUncached);

/**
 * Listado para páginas RSC cacheado entre peticiones (Vercel). La API GET sigue usando `listClients`.
 */
export const listClientsCachedForRsc = unstable_cache(fetchAllClientsUncached, ['nutrimax-clients-list'], {
  revalidate: 180,
  tags: [NUTRIMAX_READ_CACHE_TAG],
});

/** Una lectura por request (RSC/API): evita repetir SELECT cuando timeline/asignaciones/progreso validan el mismo id. */
export const getClientById = cache(async (id: string): Promise<ClientRow> => {
  const row = await dbQueryOne<ClientRow>(`SELECT * FROM clients WHERE id = $1`, [id]);
  if (!row) throw new ApiError(404, 'No encontramos ese paciente.');
  return row;
});

export async function createClient(raw: unknown): Promise<ClientRow> {
  const body = createClientBodySchema.parse(raw);
  const derived = computeDerived(body);
  const email = body.email === '' ? null : body.email ?? null;

  const rows = await dbQuery<ClientRow>(
    `INSERT INTO clients (
        full_name, email, phone, age, sex, weight_kg, height_cm, body_fat_pct, waist_cm, goal_weight_kg,
        bioimpedance_report, derived_metrics, clinical_profile
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12::jsonb,$13::jsonb)
      RETURNING *`,
    [
      body.full_name,
      email,
      body.phone ?? null,
      body.age ?? null,
      body.sex ?? null,
      body.weight_kg ?? null,
      body.height_cm ?? null,
      body.body_fat_pct ?? null,
      body.waist_cm ?? null,
      body.goal_weight_kg ?? null,
      body.bioimpedance_report ? JSON.stringify(body.bioimpedance_report) : null,
      JSON.stringify(derived),
      JSON.stringify(body.clinical_profile),
    ],
  );
  const client = rows[0];
  await insertRevision(client.id, body.clinical_profile, 'Alta inicial');
  await insertTimeline(client.id, 'client_created', 'Paciente creado', null, {});
  return client;
}

export async function updateClient(id: string, raw: unknown): Promise<ClientRow> {
  await getClientById(id);
  const body = createClientBodySchema.parse(raw);
  const derived = computeDerived(body);
  const email = body.email === '' ? null : body.email ?? null;

  const rows = await dbQuery<ClientRow>(
    `UPDATE clients SET
        full_name = $1, email = $2, phone = $3, age = $4, sex = $5,
        weight_kg = $6, height_cm = $7, body_fat_pct = $8, waist_cm = $9, goal_weight_kg = $10,
        bioimpedance_report = $11::jsonb, derived_metrics = $12::jsonb, clinical_profile = $13::jsonb,
        clinical_profile_version = clinical_profile_version + 1
      WHERE id = $14
      RETURNING *`,
    [
      body.full_name,
      email,
      body.phone ?? null,
      body.age ?? null,
      body.sex ?? null,
      body.weight_kg ?? null,
      body.height_cm ?? null,
      body.body_fat_pct ?? null,
      body.waist_cm ?? null,
      body.goal_weight_kg ?? null,
      body.bioimpedance_report ? JSON.stringify(body.bioimpedance_report) : null,
      JSON.stringify(derived),
      JSON.stringify(body.clinical_profile),
      id,
    ],
  );
  const client = rows[0];
  await insertRevision(client.id, body.clinical_profile, 'Perfil actualizado');
  await insertTimeline(client.id, 'profile_updated', 'Perfil actualizado', null, {});
  return client;
}

export async function previewMetrics(raw: unknown): Promise<Record<string, unknown>> {
  const body = createClientBodySchema.parse(raw);
  return computeDerived(body);
}

async function insertRevision(clientId: string, snapshot: unknown, summary?: string): Promise<void> {
  await dbQuery(
    `INSERT INTO clinical_profile_revisions (client_id, snapshot, change_summary)
       VALUES ($1, $2::jsonb, $3)`,
    [clientId, JSON.stringify(snapshot), summary ?? null],
  );
}

async function insertTimeline(
  clientId: string,
  type: string,
  title: string,
  body: string | null,
  payload: Record<string, unknown>,
): Promise<void> {
  await dbQuery(
    `INSERT INTO client_timeline_events (client_id, type, title, body, payload)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [clientId, type, title, body, JSON.stringify(payload)],
  );
}

export async function getTimeline(clientId: string, limit = 50): Promise<unknown[]> {
  return dbQuery(
    `SELECT id, type, title, body, created_at
       FROM client_timeline_events
       WHERE client_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
    [clientId, limit],
  );
}

export async function deleteClient(id: string): Promise<{ deleted: true }> {
  await getClientById(id);
  await dbQuery(`DELETE FROM clients WHERE id = $1`, [id]);
  return { deleted: true };
}
