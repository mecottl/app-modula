# Puesta en marcha local — Fase 0

Este documento cubre solo el arranque local del código de la Fase 0
(modelo de datos, motor de precio, autenticación básica y aislamiento
multi-tenant). El detalle funcional completo está en [README.md](README.md).

## 1. Requisitos

- Node.js 20+
- Una cuenta de Supabase (usamos su Postgres gestionado, no Docker)

## 2. Base de datos

El proyecto ya vive en Supabase: **`configurador-cotizacion`**
(ref `huqailndoltfygxjczkv`, https://huqailndoltfygxjczkv.supabase.co).

El esquema completo (`prisma/migrations/20260911000000_init`) y RLS
habilitado en todas las tablas (`prisma/migrations/20260911000001_enable_rls`)
ya están aplicados, y los datos de prueba del seed ya fueron insertados
directamente vía SQL (ver sección 3). No hace falta correr migraciones
para empezar a probar.

Para conectar tu entorno local necesitas la cadena de conexión real:

1. Entra a https://supabase.com/dashboard/project/huqailndoltfygxjczkv/settings/database
2. Copia la "Connection string" (modo *Session* o *Direct connection* para
   desarrollo local; *Transaction pooling* si vas a desplegar en serverless).
3. Pégala en tu `.env.local` como `DATABASE_URL`.

```bash
cp .env.example .env.local
```

Genera un `AUTH_SECRET` real:

```bash
npx auth secret
```

## 3. Datos de prueba (ya insertados)

Se insertó manualmente (vía SQL, sin pasar por `npm run db:seed`, porque no
se dispone de la contraseña de la base de datos desde este entorno):

- Cuenta "Desarrolladora Demo" (plan Básico)
- Usuario del dashboard: `admin@demo.com` / `demo1234`
- Desarrollo `los-encinos` (publicado), con un modelo ("Modelo Roble",
  $1,850,000), un nivel de acabado ("Acabados Premium", +$150,000), un
  extra ("Cocina integral", +$60,000) y una promoción de lanzamiento
  vigente (5%).

Si en algún momento reseteas la base de datos, `npm run db:seed`
(`prisma/seed.ts`) recrea el mismo escenario usando tu `DATABASE_URL` real.

## 4. Levantar la app

```bash
npm install
npm run dev
```

- Dashboard (protegido, requiere login): http://localhost:3000/dashboard
- Login: http://localhost:3000/login
- Motor de precio (Plan A/B), ejemplo:

```bash
curl -X POST http://localhost:3000/api/developments/los-encinos/pricing \
  -H "Content-Type: application/json" \
  -d '{"modelId":"<id del modelo Roble>","extraIds":[]}'
```

## 5. Qué falta después de la Fase 0

El dashboard y el configurador público visual (módulos de Catálogo,
Acabados y extras, Reglas de precio, Cotizaciones, página pública) son
Fase 1 — ver los issues correspondientes en el repositorio de GitHub.
