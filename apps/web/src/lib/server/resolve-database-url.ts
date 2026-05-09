/**
 * Resuelve la cadena de conexión Postgres para Supabase.
 * 1) Si DATABASE_URL está definida y no contiene el placeholder, se usa tal cual.
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

export function resolveDatabaseUrl(): string {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct && !direct.includes('YOUR_DB_PASSWORD')) {
    if (isSupabasePostgresUrl(direct) && !/sslmode=/i.test(direct)) {
      const sep = direct.includes('?') ? '&' : '?';
      return `${direct}${sep}sslmode=require`;
    }
    return direct;
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
  /** Supabase exige SSL; en Vercel/serverless sin esto `pg` suele fallar con 500. */
  return `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres?sslmode=require`;
}
