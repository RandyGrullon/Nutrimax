import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseCookieOptions } from '@/lib/supabase/session-config';

function supabasePublicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

/**
 * Singleton browser client — avoids creating a new GoTrue/Realtime instance
 * on every `apiFetch` call, which was causing unnecessary memory allocations
 * and repeated `getSession()` initialization overhead.
 */
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = supabasePublicKey();
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL and (NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)',
    );
  }
  _client = createBrowserClient(url, key, {
    cookieOptions: getSupabaseCookieOptions(),
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}
