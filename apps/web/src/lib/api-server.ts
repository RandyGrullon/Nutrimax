import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ensureArray } from '@/lib/ensure-array';
import { getInternalApiOrigin } from '@/lib/internal-api-origin';
import { toApiPath } from '@/lib/api-path';

export async function apiServerFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const supabase = await createClient();
  const baseHeaders = new Headers(init.headers);
  baseHeaders.set('Content-Type', 'application/json');

  /** No bloquear por `getUser()`: si falla la red/JWT momentáneo, `getSession()` sigue devolviendo access_token útil para /api. */
  async function accessToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function doFetch(): Promise<Response> {
    const token = await accessToken();
    const headers = new Headers(baseHeaders);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const pathNorm = path.startsWith('/') ? path : `/${path}`;
    const url = `${await getInternalApiOrigin()}${toApiPath(pathNorm)}`;

    const jar = await cookies();
    const serialized = jar.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    if (serialized) headers.set('Cookie', serialized);

    return fetch(url, { ...init, headers, cache: 'no-store' });
  }

  let res = await doFetch();
  if (res.status === 401) {
    await supabase.auth.refreshSession();
    res = await doFetch();
  }
  return res;
}

export async function apiServerJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiServerFetch(path, init);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Lista desde API en servidor: errores o JSON no-array → []. */
export async function apiServerJsonArray<T>(path: string, init?: RequestInit): Promise<T[]> {
  try {
    const res = await apiServerFetch(path, init);
    if (!res.ok) return [];
    const data: unknown = await res.json();
    return ensureArray<T>(data);
  } catch {
    return [];
  }
}
