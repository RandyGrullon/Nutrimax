# Conectar NutriMax con Supabase (paso a paso)

Esta guía enlaza **Supabase** (Postgres + Auth) con el monorepo: **Next.js** (`apps/web`) y **NestJS** (`apps/api`).

> **Importante:** no subas archivos `.env` ni `.env.local` con secretos a Git. Usa solo los `.env.example` como plantilla.

---

## 1. Crear el proyecto en Supabase

1. Entra en [https://supabase.com](https://supabase.com) e inicia sesión.
2. Pulsa **New project**.
3. Elige **organización**, **nombre del proyecto**, **región** cercana a tus usuarios.
4. Define una **contraseña fuerte** para el usuario `postgres` de la base de datos. **Guárdala**: la necesitarás en la URI de conexión.
5. Espera a que el proyecto esté en estado **Healthy**.

---

## 2. Crear las tablas (migración SQL)

1. En el dashboard de tu proyecto, ve a **SQL Editor** (menú lateral).
2. Pulsa **New query**.
3. Abre en tu editor local el archivo del repo:  
   [`supabase/migrations/001_nutrimax_initial.sql`](../supabase/migrations/001_nutrimax_initial.sql)
4. Copia **todo** el contenido y pégalo en el editor de Supabase.
5. Pulsa **Run**.
6. Si aparece un error relacionado con el trigger (`EXECUTE PROCEDURE` vs `EXECUTE FUNCTION`), depende de la versión de Postgres en Supabase:
   - En **Postgres 14** suele usarse: `EXECUTE PROCEDURE public.set_updated_at();`
   - En **Postgres 15+** a veces: `EXECUTE FUNCTION public.set_updated_at();`  
   Cambia solo esa línea en los dos `CREATE TRIGGER` y vuelve a ejecutar el script (o elimina primero los objetos creados con un `DROP` si hace falta empezar de cero en un proyecto de prueba).

7. Comprueba en **Table Editor** que existan las tablas: `clients`, `clinical_profile_revisions`, `diets`, `client_diet_assignments`, `client_timeline_events`.

---

## 3. Copiar credenciales del dashboard

Ve a **Project Settings** (engranaje) y anota lo siguiente.

### 3.1 API (para Next y validación JWT en Nest)

Ruta: **Settings → API**

| Valor en Supabase | Variable en tu máquina |
|-------------------|-------------------------|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_URL` |
| **anon public** (clave pública) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role** (secreto, solo servidor) | `SUPABASE_SERVICE_ROLE_KEY` |
| **JWT Secret** (sección *JWT Settings*) | `SUPABASE_JWT_SECRET` |

- La clave **anon** puede ir en el front (Next) porque el navegador la usa con Supabase Auth.
- La clave **service_role** y el **JWT Secret** son **solo para backend** (`apps/api`). No los pongas en `NEXT_PUBLIC_*` ni en código del cliente.

### 3.2 Base de datos (para Nest)

Ruta: **Settings → Database**

1. En **Connection string**, elige **URI** (o la cadena que indique conexión directa a Postgres, puerto `5432`).
2. Sustituye `[YOUR-PASSWORD]` por la contraseña del usuario `postgres` que definiste al crear el proyecto.
3. Esa cadena completa es tu **`DATABASE_URL`**.

Ejemplo de forma (los valores reales son los de tu proyecto):

```text
postgresql://postgres:TU_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

---

## 4. Configurar variables en el repositorio

### 4.1 Next.js — `apps/web/.env.local`

Crea el archivo **`apps/web/.env.local`** (no está en Git). Puedes partir de [`apps/web/.env.example`](../apps/web/.env.example):

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API integrada en el mismo Next (/api). Opcional si usas Nest u otro host:
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Solo servidor — necesarias para Route Handlers /api (Postgres + validación JWT)
SUPABASE_DB_PASSWORD=TU_PASSWORD_POSTGRES
SUPABASE_URL=https://TU_REF.supabase.co
SUPABASE_JWT_SECRET=TU_JWT_SECRET
```

- Sin `NEXT_PUBLIC_API_URL`, el front llama a **`/api`** en el mismo origen (recomendado en Vercel).

### 4.2 API en Nest (opcional, legado)

Si vuelves a usar el proyecto Nest en `apps/api`, las variables eran las mismas de Postgres y JWT; hoy la app está pensada para **solo Next** — ver [`VERCEL_Y_PRODUCCION.md`](./VERCEL_Y_PRODUCCION.md).

---

## 5. Auth: crear usuario y probar sesión

1. En Supabase: **Authentication → Users → Add user** (o regístrate desde la pantalla `/login` de la app si tienes el registro habilitado).
2. Arranca la API y el front:

   ```bash
   pnpm install
   pnpm --filter @nutrimax/api dev
   pnpm --filter @nutrimax/web dev
   ```

3. Abre `http://localhost:3000/login`, inicia sesión con el usuario creado.
4. El middleware de Next redirige a login si no hay sesión; las rutas protegidas llaman a Nest con el **Bearer token** de Supabase. Nest valida el JWT con **`SUPABASE_JWT_SECRET`**.

Si Nest responde **401 Unauthorized**, revisa que el JWT Secret en `apps/api/.env` coincida exactamente con el del dashboard y que el header `Authorization: Bearer <access_token>` llegue desde el front (sesión activa).

---

## 6. Producción (resumen)

1. Crea un **proyecto Supabase de producción** (o usa el mismo solo para pruebas; en producción real suele ser otro proyecto).
2. Vuelve a ejecutar la migración SQL en ese proyecto.
3. Configura las mismas variables en tu hosting:
   - **Vercel** (u otro) para `apps/web`: `NEXT_PUBLIC_*` y URL pública de la API.
   - **Servidor de Nest**: `DATABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGINS` con el dominio HTTPS del front.

**HTTPS** es obligatorio para PWA y service worker en producción.

---

## 7. Comprobación rápida

| Comprobación | Cómo |
|--------------|------|
| Tablas creadas | Table Editor en Supabase |
| Nest ↔ Postgres | Arrancar API sin error ( `SUPABASE_DB_PASSWORD` + `SUPABASE_URL` o `DATABASE_URL` ); crear un cliente desde la UI |
| Next ↔ Supabase Auth | Login en `/login` |
| Next ↔ Nest | Lista de clientes en `/clients` con usuario logueado |

Si algo falla, el primer sitio a revisar es que **`SUPABASE_JWT_SECRET`** y la conexión Postgres (`SUPABASE_DB_PASSWORD` / `DATABASE_URL`) correspondan al **mismo** proyecto que **`NEXT_PUBLIC_SUPABASE_URL`**.
