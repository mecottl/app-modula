# Puesta en marcha local — Fase 0

Este documento cubre solo el arranque local del código de la Fase 0
(modelo de datos, motor de precio, autenticación básica y aislamiento
multi-tenant). El detalle funcional completo está en [README.md](README.md).

## 1. Requisitos

- Node.js 20+
- Una cuenta de Supabase (usamos su Postgres gestionado, no Docker)

## 2. Base de datos

El proyecto ya vive en Supabase: **`MODULA`**
(ref `huqailndoltfygxjczkv`, https://huqailndoltfygxjczkv.supabase.co).

El esquema completo (`prisma/migrations/20260911000000_init`) y RLS
habilitado en todas las tablas (`prisma/migrations/20260911000001_enable_rls`)
ya están aplicados, y los datos de prueba del seed ya fueron insertados
directamente vía SQL (ver sección 3). No hace falta correr migraciones
para empezar a probar.

Para conectar tu entorno local necesitas la cadena de conexión real:

1. Entra a https://supabase.com/dashboard/project/huqailndoltfygxjczkv/settings/database
2. Copia la "Connection string" en modo *Session* (puerto 5432) y pégala
   como `DATABASE_URL` **y** como `DIRECT_URL` en tu `.env.local`.
3. En producción (Vercel u otro serverless), `DATABASE_URL` debería ser el
   pooler en modo *Transaction* (puerto 6543, `?pgbouncer=true`) — es el
   recomendado para muchas funciones concurrentes — dejando `DIRECT_URL`
   en modo *Session* solo para migraciones. En esta máquina de desarrollo
   el modo transacción se cuelga indefinidamente con Prisma sin dar error
   (parece un problema de red/ISP, no del pooler); por eso en local se usa
   modo sesión para ambas variables. Ver issue "Resolver estrategia de
   conexión a Postgres para despliegue serverless" antes de desplegar.

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

## 5. Estado del proyecto

Las Fases 0 a 3 de la especificación están implementadas y verificadas
(dashboard completo, configurador público, widget embebible Plan B,
analítica, miembros, facturación manual, CSV, webhooks). Ver el backlog
en GitHub para el detalle fase por fase.

Antes de desplegar a producción con tráfico real, conviene resolver los
issues de endurecimiento del backend: rate limiting (ya implementado),
monitoreo de errores (logging estructurado implementado; falta conectar
un servicio real como Sentry si se quiere alertas activas), y la
estrategia de conexión a Postgres para serverless (ver sección 2).
