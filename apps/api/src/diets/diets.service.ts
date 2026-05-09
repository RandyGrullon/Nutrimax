import { createDietBodySchema, updateDietBodySchema } from '@nutrimax/shared';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async create(body: unknown): Promise<DietRow> {
    const parsed = createDietBodySchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? 'Datos de dieta no válidos.';
      throw new BadRequestException(first);
    }
    const { name, description, plan } = parsed.data;
    const rows = await this.db.query<DietRow>(
      `INSERT INTO diets (name, description, plan) VALUES ($1, $2, $3::jsonb) RETURNING *`,
      [name, description, JSON.stringify(plan)],
    );
    return rows[0];
  }

  async update(id: string, body: unknown): Promise<DietRow> {
    await this.getById(id);
    const parsed = updateDietBodySchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message ?? 'Datos de dieta no válidos.';
      throw new BadRequestException(first);
    }
    const { name, description, plan } = parsed.data;
    const rows = await this.db.query<DietRow>(
      `UPDATE diets SET name = $1, description = $2, plan = $3::jsonb WHERE id = $4 RETURNING *`,
      [name, description, JSON.stringify(plan), id],
    );
    return rows[0];
  }
}
