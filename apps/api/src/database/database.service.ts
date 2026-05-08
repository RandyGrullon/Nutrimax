import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, type QueryResultRow } from 'pg';
import { resolveDatabaseUrl } from './resolve-database-url';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const connectionString = resolveDatabaseUrl();
    this.pool = new Pool({ connectionString });
  }

  async query<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<T[]> {
    const res = await this.pool.query<T>(text, params);
    return res.rows;
  }

  async queryOne<T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<T | undefined> {
    const rows = await this.query<T>(text, params);
    return rows[0];
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
