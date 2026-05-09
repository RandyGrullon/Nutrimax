import { cache } from 'react';
import {
  createFoodCategoryBodySchema,
  normalizeFoodLabelKey,
  updateFoodCategoryBodySchema,
} from '@nutrimax/shared';
import { ApiError } from '@/lib/server/auth';
import { dbQuery, dbQueryOne } from '@/lib/server/db';

export interface FoodCategoryRow {
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  name_normalized: string;
  sort_order: number;
}

export const listFoodCategories = cache(async (): Promise<FoodCategoryRow[]> => {
  return dbQuery<FoodCategoryRow>(
    `SELECT * FROM food_categories ORDER BY sort_order ASC, name ASC`,
  );
});

export async function getFoodCategoryById(id: string): Promise<FoodCategoryRow> {
  const row = await dbQueryOne<FoodCategoryRow>(`SELECT * FROM food_categories WHERE id = $1`, [id]);
  if (!row) throw new ApiError(404, 'No encontramos esa categoría.');
  return row;
}

function isUniqueViolation(e: unknown): boolean {
  return typeof e === 'object' && e !== null && 'code' in e && String((e as { code: unknown }).code) === '23505';
}

export async function createFoodCategory(body: unknown): Promise<FoodCategoryRow> {
  const parsed = createFoodCategoryBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Datos no válidos.');
  }
  const sort = parsed.data.sort_order ?? 0;
  const name = parsed.data.name.trim();
  const name_normalized = normalizeFoodLabelKey(name);
  const dup = await dbQueryOne<{ id: string }>(
    `SELECT id FROM food_categories WHERE name_normalized = $1`,
    [name_normalized],
  );
  if (dup) {
    throw new ApiError(
      409,
      'Ya existe una categoría equivalente (mismo texto ignorando mayúsculas y acentos).',
    );
  }
  try {
    const rows = await dbQuery<FoodCategoryRow>(
      `INSERT INTO food_categories (name, sort_order, name_normalized) VALUES ($1, $2, $3) RETURNING *`,
      [name, sort, name_normalized],
    );
    return rows[0];
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      throw new ApiError(
        409,
        'Ya existe una categoría equivalente (mismo texto ignorando mayúsculas y acentos).',
      );
    }
    throw e;
  }
}

export async function updateFoodCategory(id: string, body: unknown): Promise<FoodCategoryRow> {
  const row = await getFoodCategoryById(id);
  const parsed = updateFoodCategoryBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message ?? 'Datos no válidos.');
  }
  const p = parsed.data;
  if (p.name === undefined && p.sort_order === undefined) {
    throw new ApiError(400, 'Indica nombre u orden para actualizar.');
  }
  const nextName = p.name !== undefined ? p.name.trim() : row.name;
  let nextNormalized = row.name_normalized;
  if (p.name !== undefined) {
    nextNormalized = normalizeFoodLabelKey(nextName);
    const dup = await dbQueryOne<{ id: string }>(
      `SELECT id FROM food_categories WHERE name_normalized = $1 AND id <> $2`,
      [nextNormalized, id],
    );
    if (dup) {
      throw new ApiError(
        409,
        'Ya existe otra categoría equivalente (mismo texto ignorando mayúsculas y acentos).',
      );
    }
  }
  try {
    const rows = await dbQuery<FoodCategoryRow>(
      `UPDATE food_categories SET
         name = COALESCE($1, name),
         sort_order = COALESCE($2, sort_order),
         name_normalized = $3
       WHERE id = $4 RETURNING *`,
      [p.name !== undefined ? nextName : null, p.sort_order ?? null, nextNormalized, id],
    );
    return rows[0];
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      throw new ApiError(
        409,
        'Ya existe otra categoría equivalente (mismo texto ignorando mayúsculas y acentos).',
      );
    }
    throw e;
  }
}

export async function deleteFoodCategory(id: string): Promise<{ deleted: true }> {
  await getFoodCategoryById(id);
  const uses = await dbQueryOne<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM foods WHERE category_id = $1`,
    [id],
  );
  const n = Number(uses?.n ?? '0');
  if (n > 0) {
    throw new ApiError(
      409,
      'No se puede eliminar: hay alimentos en esta categoría. Muévelos o elimínalos primero.',
    );
  }
  await dbQuery(`DELETE FROM food_categories WHERE id = $1`, [id]);
  return { deleted: true };
}
