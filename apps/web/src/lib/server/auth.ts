import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseCookieOptions } from '@/lib/supabase/session-config';

export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  aud?: string;
  exp?: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function userToPayload(user: {
  id: string;
  email?: string | null;
  role?: string;
}): SupabaseJwtPayload {
  return {
    sub: user.id,
    email: user.email ?? undefined,
    role: user.role,
  };
}

/**
 * Valida la sesión leyendo el JWT desde la cookie (local, sin HTTP round-trip).
 * `getSession()` es mucho más rápido que `getUser()` (~0ms vs ~200-600ms)
 * porque solo decodifica el JWT en memoria.
 *
 * Seguridad: el middleware ya validó la sesión para rutas protegidas.
 * Los Route Handlers bajo /api no pasan por el middleware matcher,
 * pero el JWT sigue siendo firmado por Supabase; cualquier token inválido
 * simplemente no producirá sesión → 401.
 */
export async function requireAuth(req: NextRequest): Promise<SupabaseJwtPayload> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new ApiError(500, 'El servidor no puede validar sesiones. Revisa la configuración de autenticación.');
  }

  const bearer = req.headers.get('authorization')?.startsWith('Bearer ')
    ? req.headers.get('authorization')!.slice('Bearer '.length).trim()
    : '';

  const supabase = createServerClient(url, key, {
    cookieOptions: getSupabaseCookieOptions(),
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll() {
        /* Solo lectura para validar en handlers */
      },
    },
  });

  /* Si viene un Bearer token, intentamos validar con getUser para tokens explícitos.
   * Si es cookie (navegación normal), usamos getSession que es local y rápido. */
  if (bearer.length > 0) {
    const { data, error } = await supabase.auth.getUser(bearer);
    if (error || !data.user) {
      throw new ApiError(401, 'Tu sesión caducó o el token no es válido. Vuelve a iniciar sesión.');
    }
    return userToPayload(data.user);
  }

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) {
    throw new ApiError(401, 'Falta una sesión activa. Vuelve a iniciar sesión.');
  }
  return userToPayload(session.user);
}
