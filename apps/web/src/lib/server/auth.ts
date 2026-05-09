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
 * Valida la sesión con Supabase Auth (igual que el dashboard), sin depender de `SUPABASE_JWT_SECRET`.
 * Antes se usaba `jsonwebtoken` local: si el secret en `.env` no era idéntico al del proyecto,
 * aparecía «token no es válido» aunque la sesión fuera correcta.
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

  const { data, error } =
    bearer.length > 0 ? await supabase.auth.getUser(bearer) : await supabase.auth.getUser();

  const user = data.user;
  if (error || !user) {
    throw new ApiError(
      401,
      bearer.length > 0
        ? 'Tu sesión caducó o el token no es válido. Vuelve a iniciar sesión.'
        : 'Falta una sesión activa. Vuelve a iniciar sesión.',
    );
  }

  return userToPayload(user);
}
