import { createClient } from '@/lib/supabase/client';
import { ensureArray } from '@/lib/ensure-array';
import { toApiPath } from '@/lib/api-path';
import { withRequestLoading } from '@/lib/request-loading';

/** Si defines NEXT_PUBLIC_API_URL, las peticiones van a ese host (Nest u otro). Si no, usan /api en el mismo origen (Vercel). */
function externalApiBase(): string | null {
  const b = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (b && b.length > 0) return b.replace(/\/$/, '');
  return null;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return withRequestLoading(async () => {
    const supabase = createClient();
    const baseHeaders = new Headers(init.headers);
    baseHeaders.set('Content-Type', 'application/json');

    async function accessToken(): Promise<string | null> {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    }

    async function doFetch(): Promise<Response> {
      const token = await accessToken();
      const headers = new Headers(baseHeaders);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      const ext = externalApiBase();
      const url = ext ? `${ext}${path.startsWith('/') ? path : `/${path}`}` : toApiPath(path);
      return fetch(url, { ...init, headers });
    }

    let res = await doFetch();
    if (res.status === 401) {
      await supabase.auth.refreshSession();
      res = await doFetch();
    }

    if (
      res.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login')
    ) {
      window.location.assign('/login');
    }

    return res;
  });
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Lista desde API: si el body no es array o falla la petición, devuelve []. */
export async function apiJsonArray<T>(path: string, init?: RequestInit): Promise<T[]> {
  try {
    const res = await apiFetch(path, init);
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return ensureArray<T>(data);
  } catch {
    return [];
  }
}
