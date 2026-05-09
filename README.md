# NutriMax

Monorepo **pnpm**: portal nutricional (Next.js 15 + Supabase). La API HTTP está en **Route Handlers** bajo `apps/web/src/app/api` — un solo despliegue en **Vercel** cubre UI y backend.

## Desarrollo

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:3000`. Variables: [`apps/web/.env.example`](apps/web/.env.example) → copia a `apps/web/.env.local` (incluye claves **solo servidor** para `/api`).

## Build

```bash
pnpm build
```

## Documentación

- [Conexión Supabase](docs/SUPABASE_CONEXION.md)
- [Vercel y producción](docs/VERCEL_Y_PRODUCCION.md)
- SQL inicial: [`supabase/migrations/001_nutrimax_initial.sql`](supabase/migrations/001_nutrimax_initial.sql)
