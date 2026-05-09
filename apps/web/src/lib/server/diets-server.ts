import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { createDietBodySchema, updateDietBodySchema } from '@nutrimax/shared';
import { ApiError } from '@/lib/server/auth';
import { assertMealPlanCompatibleWithDiet } from '@/lib/server/diet-meal-plan-link';
import { dbQuery, dbQueryOne } from '@/lib/server/db';
import { NUTRIMAX_READ_CACHE_TAG } from '@/lib/server/read-cache';
import { getMealPlanById, resolveMealPlanForDisplay, type ResolvedMealPlan } from '@/lib/server/meal-plans-server';

export interface DietRow {
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string | null;
  plan: unknown;
  meal_plan_id: string | null;
}

export type DietListRow = DietRow & {
  meal_plan_name: string | null;
};

export type DietDetailRow = DietRow & {
  meal_plan: ResolvedMealPlan | null;
};

async function fetchDietsListUncached(): Promise<DietListRow[]> {
  return dbQuery<DietListRow>(
    `SELECT d.id, d.created_at, d.updated_at, d.name, d.description, d.plan, d.meal_plan_id,
            mp.name AS meal_plan_name
       FROM diets d
       LEFT JOIN meal_plans mp ON mp.id = d.meal_plan_id
       ORDER BY d.updated_at DESC`,
  );
}

/** Una lectura por request si varias partes del árbol RSC llaman al listado (sin Data Cache). */
export const listDiets = cache(fetchDietsListUncached);

/** Biblioteca de dietas para RSC con Data Cache (Vercel). */
export const listDietsCachedForRsc = unstable_cache(fetchDietsListUncached, ['nutrimax-diets-list'], {
  revalidate: 180,
  tags: [NUTRIMAX_READ_CACHE_TAG],
});

async function fetchDietJoinRow(id: string): Promise<
  | (DietRow & {
      mp_id: string | null;
    })
  | undefined
> {
  return dbQueryOne<DietRow & { mp_id: string | null }>(
    `SELECT d.id, d.created_at, d.updated_at, d.name, d.description, d.plan, d.meal_plan_id,
            mp.id AS mp_id
       FROM diets d
       LEFT JOIN meal_plans mp ON mp.id = d.meal_plan_id
       WHERE d.id = $1`,
    [id],
  );
}

/** Una lectura por request: `generateMetadata` y la página comparten la misma fila. */
export const getDietById = cache(async (id: string): Promise<DietDetailRow> => {
  const row = await fetchDietJoinRow(id);
  if (!row) throw new ApiError(404, 'No encontramos esa dieta.');

  let meal_plan: ResolvedMealPlan | null = null;
  if (row.meal_plan_id && row.mp_id) {
    const mp = await getMealPlanById(row.meal_plan_id);
    meal_plan = await resolveMealPlanForDisplay(mp);
  }

  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    name: row.name,
    description: row.description,
    plan: row.plan,
    meal_plan_id: row.meal_plan_id,
    meal_plan,
  };
});

export async function createDiet(body: unknown): Promise<DietDetailRow> {
  const parsed = createDietBodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Datos de dieta no válidos.';
    throw new ApiError(400, first);
  }
  const { name, description, plan, meal_plan_id: rawMeal } = parsed.data;
  const meal_plan_id = rawMeal ?? null;
  await assertMealPlanCompatibleWithDiet({ mealPlanId: meal_plan_id, dietPlan: plan });

  const rows = await dbQuery<DietRow>(
    `INSERT INTO diets (name, description, plan, meal_plan_id)
       VALUES ($1, $2, $3::jsonb, $4)
       RETURNING id, created_at, updated_at, name, description, plan, meal_plan_id`,
    [name, description, JSON.stringify(plan), meal_plan_id],
  );
  const created = rows[0];
  return getDietById(created.id);
}

export async function updateDiet(id: string, body: unknown): Promise<DietDetailRow> {
  const existing = await fetchDietJoinRow(id);
  if (!existing) throw new ApiError(404, 'No encontramos esa dieta.');
  const parsed = updateDietBodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Datos de dieta no válidos.';
    throw new ApiError(400, first);
  }
  const { name, description, plan, meal_plan_id: rawMeal } = parsed.data;
  const meal_plan_id = rawMeal ?? null;
  await assertMealPlanCompatibleWithDiet({ mealPlanId: meal_plan_id, dietPlan: plan });

  const rows = await dbQuery<DietRow>(
    `UPDATE diets SET name = $1, description = $2, plan = $3::jsonb, meal_plan_id = $4
       WHERE id = $5
       RETURNING id, created_at, updated_at, name, description, plan, meal_plan_id`,
    [name, description, JSON.stringify(plan), meal_plan_id, id],
  );
  if (!rows[0]) throw new ApiError(404, 'No encontramos esa dieta.');
  return getDietById(id);
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
