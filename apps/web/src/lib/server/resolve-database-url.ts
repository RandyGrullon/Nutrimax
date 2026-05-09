/**
 * Resuelve la cadena de conexión Postgres para Supabase.
 * 1) Si DATABASE_URL está definida y no contiene el placeholder, se usa tal cual (tras normalizar).
 * 2) Si no, se arma con SUPABASE_DB_PASSWORD + SUPABASE_URL (https://<ref>.supabase.co).
 */

export function isSupabasePostgresUrl(connectionString: string): boolean {
  const h = connectionString.toLowerCase();
  return (
    h.includes('supabase.co') ||
    h.includes('pooler.supabase.com') ||
    h.includes('supabase.com')
  );
}

/** Pooler modo transacción (Vercel/serverless): sin esto `pg` puede fallar con 500. */
function usesSupabaseTransactionPooler(connectionString: string): boolean {
  const lower = connectionString.toLowerCase();
  return (
    lower.includes(':6543/') ||
    lower.includes('pooler.supabase.com') ||
    lower.includes('.pooler.supabase.com')
  );
}

/** Añade sslmode y pgbouncer según corresponda (Supabase + pooler). */
export function finalizeSupabaseConnectionString(connectionString: string): string {
  let url = connectionString;
  if (isSupabasePostgresUrl(url) && !/sslmode=/i.test(url)) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}sslmode=require`;
  }
  if (usesSupabaseTransactionPooler(url) && !/[?&]pgbouncer=true/i.test(url)) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}pgbouncer=true`;
  }
  return url;
}

export function resolveDatabaseUrl(): string {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct && !direct.includes('YOUR_DB_PASSWORD')) {
    return finalizeSupabaseConnectionString(direct);
  }

  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  if (!password) {
    throw new Error(
      'Define DATABASE_URL (completa) o SUPABASE_DB_PASSWORD junto con SUPABASE_URL (https://<ref>.supabase.co)',
    );
  }
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL es obligatoria para construir la URI si usas SUPABASE_DB_PASSWORD');
  }

  const m = supabaseUrl.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i);
  if (!m) {
    throw new Error('SUPABASE_URL debe ser https://<project-ref>.supabase.co');
  }
  const ref = m[1];
  const encoded = encodeURIComponent(password);
  /** Conexión directa 5432: SSL obligatorio en remoto; en Vercel si falla, usa DATABASE_URL del pooler :6543. */
  const built = `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres?sslmode=require`;
  return finalizeSupabaseConnectionString(built);
}
