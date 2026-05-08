import { Pool, type QueryResultRow } from 'pg';
import { resolveDatabaseUrl } from '@/lib/server/resolve-database-url';

declare global {
  // eslint-disable-next-line no-var
  var __nutrimaxPgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!globalThis.__nutrimaxPgPool) {
    globalThis.__nutrimaxPgPool = new Pool({
      connectionString: resolveDatabaseUrl(),
      max: process.env.VERCEL ? 5 : 10,
    });
  }
  return globalThis.__nutrimaxPgPool;
}

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const pool = getPool();
  const res = await pool.query<T>(text, params);
  return res.rows;
}

export async function dbQueryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | undefined> {
  const rows = await dbQuery<T>(text, params);
  return rows[0];
}
