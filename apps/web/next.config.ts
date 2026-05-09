import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  /** Sustituye la entrada por defecto «apis» (NetworkFirst + caché) por NetworkOnly con el mismo cacheName. */
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
          sameOrigin &&
          url.pathname.startsWith('/api/') &&
          !url.pathname.startsWith('/api/auth/callback'),
        handler: 'NetworkOnly',
        method: 'GET',
        options: {
          cacheName: 'apis',
        },
      },
      {
        urlPattern: ({ url, sameOrigin, request }: { url: URL; sameOrigin: boolean; request: Request }) =>
          sameOrigin &&
          url.pathname.startsWith('/api/') &&
          !url.pathname.startsWith('/api/auth/callback') &&
          request.method !== 'GET',
        handler: 'NetworkOnly',
        options: {
          cacheName: 'apis-mutations',
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nutrimax/shared'],
  /** Evita vendor-chunks rotos de Supabase tras cambios de lockfile o builds parciales (pnpm + Webpack). */
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/ssr', '@supabase/auth-js'],
  experimental: {
    /** Menos JS por ruta al importar solo los iconos usados. */
    optimizePackageImports: ['lucide-react'],
    /**
     * Cache en el cliente para navegaciones repetidas (volver a una vista reciente).
     * Las APIs siguen validando sesión; datos muy sensibles pueden seguir usando revalidate/reload donde haga falta.
     */
    /** En producción (p. ej. Vercel) las revisitas al mismo segmento reutilizan el RSC en cliente más tiempo. */
    staleTimes: {
      dynamic: 120,
      static: 600,
    },
  },
};

export default withPWA(nextConfig);
