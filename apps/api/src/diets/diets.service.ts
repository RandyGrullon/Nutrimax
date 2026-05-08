import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface DietRow {
  id: string;
  created_at: Date;
  updated_at: Date;
  name: string;
  description: string | null;
  plan: unknown;
}

@Injectable()
export class DietsService {
  constructor(private readonly db: DatabaseService) {}

  async list(): Promise<DietRow[]> {
    return this.db.query<DietRow>(`SELECT * FROM diets ORDER BY updated_at DESC`);
  }

  async getById(id: string): Promise<DietRow> {
    const row = await this.db.queryOne<DietRow>(`SELECT * FROM diets WHERE id = $1`, [id]);
    if (!row) throw new NotFoundException('Diet not found');
    return row;
  }

  async create(body: { name: string; description?: string; plan?: unknown }): Promise<DietRow> {
    const rows = await this.db.query<DietRow>(
      `INSERT INTO diets (name, description, plan) VALUES ($1, $2, $3::jsonb) RETURNING *`,
      [body.name, body.description ?? null, JSON.stringify(body.plan ?? {})],
    );
    return rows[0];
  }

  async update(
    id: string,
    body: { name?: string; description?: string; plan?: unknown },
  ): Promise<DietRow> {
    await this.getById(id);
    const rows = await this.db.query<DietRow>(
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
}
