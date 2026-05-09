import { cache } from 'react';
import { createDietBodySchema, updateDietBodySchema } from '@nutrimax/shared';
import { ApiError } from '@/lib/server/auth';
import { dbQuery, dbQueryOne } from '@/lib/server/db';

export interface DietRow {
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string | null;
  plan: unknown;
}

/** Una lectura por request si varias partes del árbol RSC llaman al listado. */
export const listDiets = cache(async (): Promise<DietRow[]> => {
  return dbQuery<DietRow>(`SELECT * FROM diets ORDER BY updated_at DESC`);
});

/** Una lectura por request: `generateMetadata` y la página comparten la misma fila. */
export const getDietById = cache(async (id: string): Promise<DietRow> => {
  const row = await dbQueryOne<DietRow>(`SELECT * FROM diets WHERE id = $1`, [id]);
  if (!row) throw new ApiError(404, 'No encontramos esa dieta.');
  return row;
});

export async function createDiet(body: unknown): Promise<DietRow> {
  const parsed = createDietBodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Datos de dieta no válidos.';
    throw new ApiError(400, first);
  }
  const { name, description, plan } = parsed.data;
  const rows = await dbQuery<DietRow>(
    `INSERT INTO diets (name, description, plan) VALUES ($1, $2, $3::jsonb) RETURNING *`,
    [name, description, JSON.stringify(plan)],
  );
  return rows[0];
}

export async function updateDiet(id: string, body: unknown): Promise<DietRow> {
  await getDietById(id);
  const parsed = updateDietBodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Datos de dieta no válidos.';
    throw new ApiError(400, first);
  }
  const { name, description, plan } = parsed.data;
  const rows = await dbQuery<DietRow>(
    `UPDATE diets SET name = $1, description = $2, plan = $3::jsonb WHERE id = $4 RETURNING *`,
    [name, description, JSON.stringify(plan), id],
  );
  return rows[0];
}

export async function deleteDiet(id: string): Promise<{ deleted: true }> {
  await getDietById(id);
  try {
    await dbQuery(`DELETE FROM diets WHERE id = $1`, [id]);
  } catch (e: unknown) {
    const code =
      typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
    if (code === '23503') {
      throw new ApiError(
        409,
        'No se puede eliminar: la dieta está vinculada a pacientes. Archiva o reasigna antes.',
      );
    }
    throw e;
  }
  return { deleted: true };
}
