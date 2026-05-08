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

export async function listDiets(): Promise<DietRow[]> {
  return dbQuery<DietRow>(`SELECT * FROM diets ORDER BY updated_at DESC`);
}

export async function getDietById(id: string): Promise<DietRow> {
  const row = await dbQueryOne<DietRow>(`SELECT * FROM diets WHERE id = $1`, [id]);
  if (!row) throw new ApiError(404, 'Diet not found');
  return row;
}

export async function createDiet(body: {
  name: string;
  description?: string;
  plan?: unknown;
}): Promise<DietRow> {
  const rows = await dbQuery<DietRow>(
    `INSERT INTO diets (name, description, plan) VALUES ($1, $2, $3::jsonb) RETURNING *`,
    [body.name, body.description ?? null, JSON.stringify(body.plan ?? {})],
  );
  return rows[0];
}

export async function updateDiet(
  id: string,
  body: { name?: string; description?: string; plan?: unknown },
): Promise<DietRow> {
  await getDietById(id);
  const rows = await dbQuery<DietRow>(
    `UPDATE diets SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        plan = COALESCE($3::jsonb, plan)
      WHERE id = $4
      RETURNING *`,
    [
      body.name ?? null,
      body.description !== undefined ? body.description : null,
      body.plan !== undefined ? JSON.stringify(body.plan) : null,
      id,
    ],
  );
  return rows[0];
}
