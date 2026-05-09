import postgres from 'postgres';
import {
  isSupabasePostgresUrl,
  resolveDatabaseUrl,
  stripSslQueryParamsFromPostgresUrl,
} from '@/lib/server/resolve-database-url';

declare global {
  var __nutrimaxSql: ReturnType<typeof postgres> | undefined;
}

function getSql(): ReturnType<typeof postgres> {
  if (!globalThis.__nutrimaxSql) {
    const resolved = resolveDatabaseUrl();
    const supabase = isSupabasePostgresUrl(resolved);
    const connectionString = supabase ? stripSslQueryParamsFromPostgresUrl(resolved) : resolved;

    /**
     * `postgres.js` suele comportarse mejor que `pg` en Vercel + TLS de Supabase / PgBouncer.
     * prepare: false → modo transacción del pooler (6543) sin sentencias preparadas.
     */
    globalThis.__nutrimaxSql = postgres(connectionString, {
      max: process.env.VERCEL ? 1 : 10,
      idle_timeout: process.env.VERCEL ? 12 : 30,
      connect_timeout: 30,
      prepare: supabase ? false : true,
      ssl: supabase ? { rejectUnauthorized: false } : false,
      onnotice: () => {},
    });
  }
  return globalThis.__nutrimaxSql;
}

export async function dbQuery<T>(text: string, params?: unknown[]): Promise<T[]> {
  const sql = getSql();
  const rows =
    params !== undefined && params.length > 0
      ? await sql.unsafe(text, params as never[])
      : await sql.unsafe(text);
  return Array.from(rows) as T[];
}

export async function dbQueryOne<T>(text: string, params?: unknown[]): Promise<T | undefined> {
  const rows = await dbQuery<T>(text, params);
  return rows[0];
}
