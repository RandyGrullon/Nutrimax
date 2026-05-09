/**
 * Segundos de vida útil de las cookies de sesión que usa `@supabase/ssr` en el navegador.
 * Por defecto ~1 año (renovable automáticamente con refresh token mientras uses la app).
 *
 * Ajustable con `NEXT_PUBLIC_AUTH_COOKIE_MAX_AGE_SECONDS` en `.env`.
 *
 * El tiempo real hasta que “caduca el login” también depende del **JWT expiry** del proyecto
 * en Supabase (Dashboard → Authentication → Settings → JWT expiry). Para uso familiar con una
 * sola usuaria, suele ponerse alto (p. ej. `31536000` = 365 días) para que casi no vuelva a pedir contraseña.
 */
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 365;

const parsed = Number(process.env.NEXT_PUBLIC_AUTH_COOKIE_MAX_AGE_SECONDS);

export const AUTH_COOKIE_MAX_AGE_SECONDS =
  Number.isFinite(parsed) && parsed >= 300 ? Math.floor(parsed) : DEFAULT_MAX_AGE;

export function getSupabaseCookieOptions(): {
  maxAge: number;
  path: string;
  sameSite: 'lax';
  secure?: boolean;
} {
  return {
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    ...(process.env.NODE_ENV === 'production' ? { secure: true } : {}),
  };
}
