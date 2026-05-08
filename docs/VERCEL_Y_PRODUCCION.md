# NutriMax: un solo proyecto en Vercel

La API vive en **Next.js Route Handlers** (`apps/web/src/app/api/**`). Con un despliegue en **Vercel** cubres **frontend + backend HTTP** (no hace falta Nest ni otro servidor Node para esta app).

---

## Qué desplegar

| Pieza | Dónde |
|-------|--------|
| **Next.js** (`apps/web`) | Vercel (Framework: Next.js) |
| **Postgres + Auth** | Supabase (ya hosted) |

El directorio `apps/api` (Nest) quedó **fuera del workspace** y solo como referencia; ver [`apps/api/README.md`](../apps/api/README.md).

---

## Configuración Vercel

1. Conecta el repositorio y define **Root Directory**: `apps/web`.
2. **Install Command** (monorepo pnpm):

   ```bash
   cd ../.. && pnpm install
   ```

3. **Build Command**:

   ```bash
   cd ../.. && pnpm build
   ```

   (El `package.json` raíz ejecuta `shared` + `web`; el `prebuild` de web vuelve a compilar `shared` por si acaso.)

4. **Node**: 20.x (según `engines` en la raíz).

---

## Variables de entorno en Vercel

Configúralas en el proyecto Vercel (Production y Preview si aplica).

### Públicas (`NEXT_PUBLIC_*`)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon (JWT) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Opcional (formato nuevo) |

### Solo servidor (no uses prefijo `NEXT_PUBLIC_`)

Necesarias para que **`/api/*`** hable con Postgres y valide JWT:

| Variable | Descripción |
|----------|-------------|
| `SUPABASE_DB_PASSWORD` | Contraseña del usuario `postgres` del proyecto |
| `SUPABASE_URL` | Misma URL base que arriba |
| `SUPABASE_JWT_SECRET` | JWT Secret del dashboard (Settings → API → JWT) |

Opcional:

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_APP_URL` | `https://tu-dominio.vercel.app` — ayuda a que los Server Components resuelvan llamadas internas a `/api` |
| `DATABASE_URL` | Si prefieres URI Postgres completa en lugar de `SUPABASE_DB_PASSWORD` + `SUPABASE_URL` (ver [`resolve-database-url`](../apps/web/src/lib/server/resolve-database-url.ts)) |
| `NEXT_PUBLIC_API_URL` | Solo si quieres delegar la API a **otro** host (Nest); si está vacío, el front usa **`/api` en el mismo origen** |

### Supabase Auth

En el dashboard: **Site URL** y **Redirect URLs** con tu URL de Vercel (`https://....vercel.app` o dominio propio).

---

## PWA y HTTPS

Vercel sirve **HTTPS** por defecto: correcto para PWA y service worker.

---

## Conexión Postgres en serverless

Se usa el pooler de Supabase con la URI estándar `db.<ref>.supabase.co:5432`. Si ves errores de “too many connections”, revisa en la documentación de Supabase el **pooler en modo transacción** (puerto 6543) para cargas altas.

---

## Checklist rápido

- [ ] Migración SQL aplicada en el proyecto Supabase de producción.
- [ ] Variables en Vercel: `NEXT_PUBLIC_*` + `SUPABASE_DB_PASSWORD` + `SUPABASE_URL` + `SUPABASE_JWT_SECRET`.
- [ ] Auth: Site URL / Redirect URLs alineados con la URL de Vercel.
- [ ] `CORS`: ya no aplica entre front y API (mismo origen). Sigue aplicando entre navegador y Supabase (dominios permitidos en Supabase).
- [ ] Probar: login → `/clients` → crear paciente.

---

## Resumen

**Un solo proyecto Vercel** despliega la UI y las rutas **`/api/*`**. Supabase sigue siendo la base de datos y el proveedor de auth. No necesitas otro hosting para la API **salvo** que quieras volver a usar Nest vía `NEXT_PUBLIC_API_URL`.
