import { createClient } from '@/lib/supabase/server';
import { getInternalApiOrigin } from '@/lib/internal-api-origin';
import { toApiPath } from '@/lib/api-path';

function externalApiBase(): string | null {
  const b = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (b && b.length > 0) return b.replace(/\/$/, '');
  return null;
}

export async function apiServerFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const supabase = await createClient();
  const baseHeaders = new Headers(init.headers);
  baseHeaders.set('Content-Type', 'application/json');

  async function accessToken(): Promise<string | null> {
    const { error: userErr } = await supabase.auth.getUser();
    if (userErr) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function doFetch(): Promise<Response> {
    const token = await accessToken();
    const headers = new Headers(baseHeaders);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const ext = externalApiBase();
    const pathNorm = path.startsWith('/') ? path : `/${path}`;
    const url = ext ? `${ext}${pathNorm}` : `${await getInternalApiOrigin()}${toApiPath(pathNorm)}`;
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
