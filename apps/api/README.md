# API Nest (legado)

La API HTTP vive ahora en **Next.js Route Handlers**: `apps/web/src/app/api/**`.

Este directorio se dejó como referencia; **no forma parte del workspace pnpm** (`pnpm-workspace.yaml`). Para desarrollo solo hace falta:

```bash
pnpm --filter @nutrimax/web dev
```

Variables de entorno de servidor (`SUPABASE_JWT_SECRET`, `SUPABASE_DB_PASSWORD`, `SUPABASE_URL`, etc.) deben estar en **`apps/web/.env.local`** (o en Vercel → Environment Variables del proyecto Next).

Si aún necesitas Nest por compatibilidad, tendrías que volver a añadir `apps/api` al `pnpm-workspace.yaml` y restaurar `NEXT_PUBLIC_API_URL` en el front.
