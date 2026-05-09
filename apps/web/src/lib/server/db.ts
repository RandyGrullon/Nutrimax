import { Pool, type QueryResultRow } from 'pg';
import { isSupabasePostgresUrl, resolveDatabaseUrl } from '@/lib/server/resolve-database-url';

declare global {
  // eslint-disable-next-line no-var
  var __nutrimaxPgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!globalThis.__nutrimaxPgPool) {
    const connectionString = resolveDatabaseUrl();
    const ssl = isSupabasePostgresUrl(connectionString) ? { rejectUnauthorized: false } : undefined;

    globalThis.__nutrimaxPgPool = new Pool({
      connectionString,
      max: process.env.VERCEL ? 4 : 10,
      idleTimeoutMillis: process.env.VERCEL ? 12_000 : 30_000,
      connectionTimeoutMillis: 20_000,
      ssl,
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
