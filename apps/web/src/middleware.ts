import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseCookieOptions } from '@/lib/supabase/session-config';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  /** Nunca interceptar activos de Next, API ni estáticos públicos (evita 404 en chunks/CSS en dev). */
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/icons/') ||
    pathname === '/sw.js' ||
    pathname.endsWith('.webmanifest')
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return NextResponse.next();
  }

  const supabase = createServerClient(url, key, {
    cookieOptions: getSupabaseCookieOptions(),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next();
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  /**
   * `getSession` lee el JWT en cookie sin round-trip al servidor de Auth → navegaciones más rápidas.
   * Las rutas `/api/*` y la lógica de negocio siguen validando credenciales donde corresponda.
   */
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const isLogin = pathname.startsWith('/login');
  const isApi = pathname.startsWith('/api');
  /** Las rutas /api deben responder JSON (401), no redirección HTML, para fetch y RSC. */
  if (!user && !isLogin && !isApi) {
    const redirect = NextResponse.redirect(new URL('/login', request.url));
    return redirect;
  }
  if (user && isLogin) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

/**
 * No ejecutar Supabase auth sobre `/_next/*` ni `/api/*`. Si solo se excluye `_next/static`,
 * rutas como flight/HMR/chunks pueden entrar al middleware y romper JS/CSS (404, sin estilos).
 */
export const config = {
  matcher: ['/', '/((?!_next/|api/).*)'],
};

