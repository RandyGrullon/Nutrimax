import { cache } from 'react';
import {
  createMealPlanBodySchema,
  estimateMealPlanKcalFromItems,
  parseMealPlanItems,
  updateMealPlanBodySchema,
  type MealPlanFoodRef,
  type MealPlanReadItem,
  type MealPlanReadModel,
} from '@nutrimax/shared';
import { ApiError } from '@/lib/server/auth';
import { dbQuery, dbQueryOne } from '@/lib/server/db';
import { listFoodsByIds } from '@/lib/server/foods-server';

export interface MealPlanRow {
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string | null;
  kcal_range_min: number;
  kcal_range_max: number;
  items: unknown;
}

export const listMealPlans = cache(async (): Promise<MealPlanRow[]> => {
  return dbQuery<MealPlanRow>(`SELECT * FROM meal_plans ORDER BY updated_at DESC`);
});

export async function getMealPlanById(id: string): Promise<MealPlanRow> {
  const row = await dbQueryOne<MealPlanRow>(`SELECT * FROM meal_plans WHERE id = $1`, [id]);
  if (!row) throw new ApiError(404, 'No encontramos ese plan alimenticio.');
  return row;
}

async function assertFoodIdsExist(items: ReturnType<typeof parseMealPlanItems>): Promise<void> {
  const ids = [...new Set(items.map((i) => i.food_id))];
  if (ids.length === 0) return;
  const rows = await dbQuery<{ id: string }>(
    `SELECT id FROM foods WHERE id = ANY($1::uuid[])`,
    [ids],
  );
  const found = new Set(rows.map((r) => r.id));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new ApiError(400, 'El plan incluye alimentos que no existen en el catálogo. Revisa los ítems.');
  }
}

export async function createMealPlan(body: unknown): Promise<MealPlanRow> {
  const parsed = createMealPlanBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Datos no válidos.');
  }
  const items = parsed.data.items ?? [];
  await assertFoodIdsExist(items);
  const rows = await dbQuery<MealPlanRow>(
    `INSERT INTO meal_plans (name, description, kcal_range_min, kcal_range_max, items)
       VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING *`,
    [
      parsed.data.name.trim(),
      parsed.data.description?.trim() ?? null,
      parsed.data.kcal_range_min,
      parsed.data.kcal_range_max,
      JSON.stringify(items),
    ],
  );
  return rows[0];
}

export async function updateMealPlan(id: string, body: unknown): Promise<MealPlanRow> {
  const existing = await getMealPlanById(id);
  const parsed = updateMealPlanBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Datos no válidos.');
  }
  const p = parsed.data;
  const nextName = p.name?.trim() ?? existing.name;
  const nextDesc = p.description !== undefined ? (p.description?.trim() ?? null) : existing.description;
  const nextMin = p.kcal_range_min ?? existing.kcal_range_min;
  const nextMax = p.kcal_range_max ?? existing.kcal_range_max;
  if (nextMax < nextMin) {
    throw new ApiError(400, 'Las kcal máximas del rango deben ser mayores o iguales que las mínimas.');
  }
  const rawItems = p.items !== undefined ? p.items : parseMealPlanItems(existing.items);
  await assertFoodIdsExist(rawItems);

  const rows = await dbQuery<MealPlanRow>(
    `UPDATE meal_plans SET
       name = $1,
       description = $2,
       kcal_range_min = $3,
       kcal_range_max = $4,
       items = $5::jsonb
     WHERE id = $6 RETURNING *`,
    [nextName, nextDesc, nextMin, nextMax, JSON.stringify(rawItems), id],
  );
  return rows[0];
}

export async function deleteMealPlan(id: string): Promise<{ deleted: true }> {
  await getMealPlanById(id);
  const diets = await dbQueryOne<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM diets WHERE meal_plan_id = $1`,
    [id],
  );
  const n = Number(diets?.n ?? '0');
  if (n > 0) {
    throw new ApiError(
      409,
      'No se puede eliminar: hay dietas vinculadas a este plan alimenticio. Desvincúlalas primero.',
    );
  }
  await dbQuery(`DELETE FROM meal_plans WHERE id = $1`, [id]);
  return { deleted: true };
}

export type ResolvedMealPlan = MealPlanReadModel;

export async function resolveMealPlanForDisplay(row: MealPlanRow): Promise<ResolvedMealPlan> {
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
    id: row.id,
    name: row.name,
    description: row.description,
    kcal_range_min: row.kcal_range_min,
    kcal_range_max: row.kcal_range_max,
    items: resolvedItems,
    estimated_kcal: estimated,
  };
}
