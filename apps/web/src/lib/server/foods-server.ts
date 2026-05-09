import { cache } from 'react';
import { createFoodBodySchema, normalizeFoodLabelKey, updateFoodBodySchema } from '@nutrimax/shared';
import { ApiError } from '@/lib/server/auth';
import { dbQuery, dbQueryOne } from '@/lib/server/db';
import { getFoodCategoryById } from '@/lib/server/food-categories-server';

export interface FoodRow {
  id: string;
  created_at: Date;
  updated_at: Date;
  category_id: string;
  name: string;
  name_normalized: string;
  kcal_per_100g: string | number;
  protein_g_per_100g: string | number | null;
  carbs_g_per_100g: string | number | null;
  fat_g_per_100g: string | number | null;
  notes: string | null;
  sort_order: number;
}

export type FoodListRow = FoodRow & {
  category_name: string | null;
};

export const listFoodsWithCategories = cache(async (): Promise<FoodListRow[]> => {
  return dbQuery<FoodListRow>(
    `SELECT f.*, c.name AS category_name
       FROM foods f
       LEFT JOIN food_categories c ON c.id = f.category_id
       ORDER BY c.sort_order ASC, c.name ASC, f.sort_order ASC, f.name ASC`,
  );
});

export async function listFoodsByIds(ids: string[]): Promise<FoodRow[]> {
  if (ids.length === 0) return [];
  const rows = await dbQuery<FoodRow>(
    `SELECT * FROM foods WHERE id = ANY($1::uuid[])`,
    [ids],
  );
  return rows;
}

export async function getFoodById(id: string): Promise<FoodRow> {
  const row = await dbQueryOne<FoodRow>(`SELECT * FROM foods WHERE id = $1`, [id]);
  if (!row) throw new ApiError(404, 'No encontramos ese alimento.');
  return row;
}

function isUniqueViolation(e: unknown): boolean {
  return typeof e === 'object' && e !== null && 'code' in e && String((e as { code: unknown }).code) === '23505';
}

async function countMealPlansReferencingFood(foodId: string): Promise<number> {
  const row = await dbQueryOne<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM meal_plans mp
       WHERE EXISTS (
         SELECT 1 FROM jsonb_array_elements(mp.items) elem
         WHERE elem->>'food_id' = $1
       )`,
    [foodId],
  );
  return Number(row?.n ?? '0');
}

export async function createFood(body: unknown): Promise<FoodRow> {
  const parsed = createFoodBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Datos no válidos.');
  }
  await getFoodCategoryById(parsed.data.category_id);
  const sort = parsed.data.sort_order ?? 0;
  const name = parsed.data.name.trim();
  const name_normalized = normalizeFoodLabelKey(name);
  const dup = await dbQueryOne<{ id: string }>(
    `SELECT id FROM foods WHERE category_id = $1 AND name_normalized = $2`,
    [parsed.data.category_id, name_normalized],
  );
  if (dup) {
    throw new ApiError(
      409,
      'En esta categoría ya hay un alimento equivalente (mismo nombre ignorando mayúsculas y acentos).',
    );
  }
  try {
    const rows = await dbQuery<FoodRow>(
      `INSERT INTO foods (
          category_id, name, name_normalized, kcal_per_100g, protein_g_per_100g, carbs_g_per_100g, fat_g_per_100g, notes, sort_order
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        parsed.data.category_id,
        name,
        name_normalized,
        parsed.data.kcal_per_100g,
        parsed.data.protein_g_per_100g ?? null,
        parsed.data.carbs_g_per_100g ?? null,
        parsed.data.fat_g_per_100g ?? null,
        parsed.data.notes?.trim() ?? null,
        sort,
      ],
    );
    return rows[0];
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      throw new ApiError(
        409,
        'En esta categoría ya hay un alimento equivalente (mismo nombre ignorando mayúsculas y acentos).',
      );
    }
    throw e;
  }
}

export async function updateFood(id: string, body: unknown): Promise<FoodRow> {
  const existing = await getFoodById(id);
  const parsed = updateFoodBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Datos no válidos.');
  }
  const p = parsed.data;
  if (p.category_id) await getFoodCategoryById(p.category_id);

  const nextCategoryId = p.category_id ?? existing.category_id;
  const nextName = p.name !== undefined ? p.name.trim() : existing.name;
  const nextNormalized = normalizeFoodLabelKey(nextName);

  const dup = await dbQueryOne<{ id: string }>(
    `SELECT id FROM foods WHERE category_id = $1 AND name_normalized = $2 AND id <> $3`,
    [nextCategoryId, nextNormalized, id],
  );
  if (dup) {
    throw new ApiError(
      409,
      'En esa categoría ya existe otro alimento equivalente (mismo nombre ignorando mayúsculas y acentos).',
    );
  }

  try {
    const rows = await dbQuery<FoodRow>(
      `UPDATE foods SET
         category_id = COALESCE($1, category_id),
         name = COALESCE($2, name),
         kcal_per_100g = COALESCE($3, kcal_per_100g),
         protein_g_per_100g = COALESCE($4, protein_g_per_100g),
         carbs_g_per_100g = COALESCE($5, carbs_g_per_100g),
         fat_g_per_100g = COALESCE($6, fat_g_per_100g),
         notes = COALESCE($7, notes),
         sort_order = COALESCE($8, sort_order),
         name_normalized = $9
       WHERE id = $10 RETURNING *`,
      [
        p.category_id ?? null,
        p.name?.trim() ?? null,
        p.kcal_per_100g ?? null,
        p.protein_g_per_100g !== undefined ? p.protein_g_per_100g : null,
        p.carbs_g_per_100g !== undefined ? p.carbs_g_per_100g : null,
        p.fat_g_per_100g !== undefined ? p.fat_g_per_100g : null,
        p.notes !== undefined ? (p.notes?.trim() ?? null) : null,
        p.sort_order ?? null,
        nextNormalized,
        id,
      ],
    );
    return rows[0];
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      throw new ApiError(
        409,
        'En esa categoría ya existe otro alimento equivalente (mismo nombre ignorando mayúsculas y acentos).',
      );
    }
    throw e;
  }
}

export async function deleteFood(id: string): Promise<{ deleted: true }> {
  await getFoodById(id);
  const refs = await countMealPlansReferencingFood(id);
  if (refs > 0) {
    throw new ApiError(
      409,
      'No se puede eliminar: este alimento está en uno o más planes alimenticios. Quita las referencias primero.',
    );
  }
  await dbQuery(`DELETE FROM foods WHERE id = $1`, [id]);
  return { deleted: true };
}
