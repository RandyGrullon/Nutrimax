import { createClient } from '@/lib/supabase/client';
import { ensureArray } from '@/lib/ensure-array';
import { toApiPath } from '@/lib/api-path';
import { withRequestLoading } from '@/lib/request-loading';

/**
 * Cached access token with expiry to avoid calling getSession() on every
 * single API request. getSession() is local (JWT from cookie) but still
 * allocates and parses the token each time. This cache avoids that overhead
 * for rapid sequential/parallel requests within the same interaction.
 */
let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

async function getAccessToken(): Promise<string | null> {
  const now = Date.now();
  if (_cachedToken && _tokenExpiresAt > now) return _cachedToken;

  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) {
    _cachedToken = null;
    _tokenExpiresAt = 0;
    return null;
  }
  _cachedToken = session.access_token;
  // Cache until 60s before expiry (session.expires_at is in seconds)
  _tokenExpiresAt = (session.expires_at ?? 0) * 1000 - 60_000;
  return _cachedToken;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return withRequestLoading(async () => {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');

    const token = await getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const url = toApiPath(path);
    let res = await fetch(url, { ...init, headers });

    if (res.status === 401) {
      // Token expired — refresh and retry once
      const supabase = createClient();
      const { data } = await supabase.auth.refreshSession();
      if (data.session) {
        _cachedToken = data.session.access_token;
        _tokenExpiresAt = (data.session.expires_at ?? 0) * 1000 - 60_000;
        headers.set('Authorization', `Bearer ${data.session.access_token}`);
      }
      res = await fetch(url, { ...init, headers });
    }

    if (
      res.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login')
    ) {
      _cachedToken = null;
      _tokenExpiresAt = 0;
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
