import { createClient } from '@/lib/supabase/client';
import { toApiPath } from '@/lib/api-path';

/** Si defines NEXT_PUBLIC_API_URL, las peticiones van a ese host (Nest u otro). Si no, usan /api en el mismo origen (Vercel). */
function externalApiBase(): string | null {
  const b = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (b && b.length > 0) return b.replace(/\/$/, '');
  return null;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const ext = externalApiBase();
  const url = ext ? `${ext}${path.startsWith('/') ? path : `/${path}`}` : toApiPath(path);
  return fetch(url, { ...init, headers });
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
