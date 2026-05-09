import { Pool, escapeLiteral, type QueryResultRow } from 'pg';
import {
  isSupabasePostgresUrl,
  resolveDatabaseUrl,
  stripSslQueryParamsFromPostgresUrl,
  usesSupabaseTransactionPoolerUrl,
} from '@/lib/server/resolve-database-url';

declare global {
  // eslint-disable-next-line no-var
  var __nutrimaxPgPool: Pool | undefined;
}

let cachedConnectionString: string | undefined;

function getConnectionString(): string {
  if (cachedConnectionString === undefined) {
    cachedConnectionString = resolveDatabaseUrl();
  }
  return cachedConnectionString;
}

/**
 * PgBouncer en modo transacción no admite sentencias preparadas (protocolo extendido).
 * Sustituimos $1..$n por literales escapados (orden descendente para no confundir $1 con $10).
 */
function literalForSimpleQuery(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) throw new TypeError('Valor numérico no válido para SQL');
    return String(val);
  }
  if (typeof val === 'string') return escapeLiteral(val);
  if (val instanceof Date) return escapeLiteral(val.toISOString());
  return escapeLiteral(JSON.stringify(val));
}

function expandPlaceholders(text: string, params: unknown[]): string {
  let sql = text;
  for (let i = params.length; i >= 1; i--) {
    const lit = literalForSimpleQuery(params[i - 1]);
    sql = sql.replace(new RegExp(`\\$${i}(?!\\d)`, 'g'), lit);
  }
  return sql;
}

function getPool(): Pool {
  if (!globalThis.__nutrimaxPgPool) {
    const resolved = getConnectionString();
    const supabase = isSupabasePostgresUrl(resolved);
    const connectionString = supabase ? stripSslQueryParamsFromPostgresUrl(resolved) : resolved;
    const ssl = supabase ? { rejectUnauthorized: false as const } : undefined;

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
  const useSimple =
    usesSupabaseTransactionPoolerUrl(getConnectionString()) && params !== undefined && params.length > 0;

  const res = useSimple
    ? await pool.query<T>(expandPlaceholders(text, params))
    : await pool.query<T>(text, params);

  return res.rows;
}

export async function dbQueryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | undefined> {
  const rows = await dbQuery<T>(text, params);
  return rows[0];
}
