import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import {
  createDietBodySchema,
  updateDietBodySchema,
  estimateMealPlanKcalFromItems,
  parseMealPlanItems,
  type MealPlanFoodRef,
  type MealPlanReadItem,
} from '@nutrimax/shared';
import { ApiError } from '@/lib/server/auth';
import { dbQuery, dbQueryOne } from '@/lib/server/db';
import { NUTRIMAX_READ_CACHE_TAG } from '@/lib/server/read-cache';
import { listFoodsByIds } from '@/lib/server/foods-server';

export interface DietRow {
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string | null;
  plan: unknown;
  items: unknown;
}

export type DietListRow = DietRow;

export type DietDetailRow = DietRow & {
  resolved_items: MealPlanReadItem[];
  estimated_kcal: number;
};

async function fetchDietsListUncached(): Promise<DietListRow[]> {
  return dbQuery<DietListRow>(
    `SELECT id, created_at, updated_at, name, description, plan, items
       FROM diets
       ORDER BY updated_at DESC`,
  );
}

async function fetchDietsSummaryUncached(): Promise<{ id: string; name: string }[]> {
  return dbQuery<{ id: string; name: string }>(`SELECT id, name FROM diets ORDER BY name ASC`);
}

/** Una lectura por request si varias partes del árbol RSC llaman al listado (sin Data Cache). */
export const listDiets = cache(fetchDietsListUncached);

/** Versión ligera para selectores/paneles que solo necesitan id y nombre. */
export const listDietsSummary = cache(fetchDietsSummaryUncached);

/** Biblioteca de dietas para RSC con Data Cache (Vercel). */
export const listDietsCachedForRsc = unstable_cache(fetchDietsListUncached, ['nutrimax-diets-list'], {
  revalidate: 180,
  tags: [NUTRIMAX_READ_CACHE_TAG],
});

/** Versión ligera cacheada. */
export const listDietsSummaryCachedForRsc = unstable_cache(
  fetchDietsSummaryUncached,
  ['nutrimax-diets-summary'],
  {
    revalidate: 180,
    tags: [NUTRIMAX_READ_CACHE_TAG],
  },
);

/** Una lectura por request: `generateMetadata` y la página comparten la misma fila. */
export const getDietById = cache(async (id: string): Promise<DietDetailRow> => {
  const row = await dbQueryOne<DietRow>(
    `SELECT id, created_at, updated_at, name, description, plan, items FROM diets WHERE id = $1`,
    [id],
  );
  if (!row) throw new ApiError(404, 'No encontramos esa dieta.');

  const items = parseMealPlanItems(row.items);
  const ids = [...new Set(items.map((i) => i.food_id))];
  const foods = ids.length ? await listFoodsByIds(ids) : [];
  
  const foodMap = new Map(
    foods.map((f) => [
      f.id,
      {
        id: f.id,
        name: f.name,
        kcal_per_100g: Number(f.kcal_per_100g),
      } satisfies MealPlanFoodRef,
    ]),
  );
  const kcalMap = new Map(
    foods.map((f) => [f.id, { kcal_per_100g: Number(f.kcal_per_100g) }]),
  );
  
  const sorted = [...items].sort((a, b) => a.order - b.order || a.meal.localeCompare(b.meal));
  const estimated = estimateMealPlanKcalFromItems(items, kcalMap);
  const resolvedItems: MealPlanReadItem[] = sorted.map((it) => {
    const food = foodMap.get(it.food_id) ?? null;
    return {
      meal: it.meal,
      portion_grams: it.portion_grams,
      order: it.order,
      food,
    };
  });

  return {
    ...row,
    resolved_items: resolvedItems,
    estimated_kcal: estimated,
  };
});

export async function createDiet(body: unknown): Promise<DietDetailRow> {
  const parsed = createDietBodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Datos de dieta no válidos.';
    throw new ApiError(400, first);
  }
  const { name, description, plan } = parsed.data;

  const rows = await dbQuery<DietRow>(
    `INSERT INTO diets (name, description, plan, items)
       VALUES ($1, $2, $3::jsonb, $4::jsonb)
       RETURNING id, created_at, updated_at, name, description, plan, items`,
    [name, description, JSON.stringify(plan), JSON.stringify(plan.items ?? [])],
  );
  const created = rows[0];
  return getDietById(created.id);
}

export async function updateDiet(id: string, body: unknown): Promise<DietDetailRow> {
  await getDietById(id);
  const parsed = updateDietBodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'Datos de dieta no válidos.';
    throw new ApiError(400, first);
  }
  const { name, description, plan } = parsed.data;

  const rows = await dbQuery<DietRow>(
    `UPDATE diets SET name = $1, description = $2, plan = $3::jsonb, items = $4::jsonb
       WHERE id = $5
       RETURNING id, created_at, updated_at, name, description, plan, items`,
    [name, description, JSON.stringify(plan), JSON.stringify(plan.items ?? []), id],
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
