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

## 5. Pruebas automatizadas

```bash
npm test          # corre una vez
npm run test:watch  # modo interactivo
```

Cubren el aislamiento multi-tenant (`tests/tenant.test.ts` y
`tests/crossTenantActions.test.ts`): crean dos cuentas de prueba reales,
intentan leer/modificar los datos de una desde la sesión de la otra a
través de las mismas server actions del dashboard, y verifican que se
rechaza sin cambiar nada — y se borran solas al terminar (`afterAll`).

Necesitan un `DATABASE_URL` real apuntando a Postgres (usan tu
`.env.local` igual que `npm run dev`). En CI corren contra un Postgres
efímero propio del job (ver `.github/workflows/ci.yml`), nunca contra la
base de datos real de producción — es seguro correrlas también en local
contra la base de MODULA, ya que limpian sus propios datos.

## 6. Stripe (facturación real, probado en modo prueba)

MODULA cobra por plan vía Stripe Checkout + webhooks — `Account.plan`/
`billingStatus` se actualizan SOLO desde el webhook (nunca de forma
optimista en el checkout), y el widget/Integración (Plan B) están
bloqueados en servidor para cuentas en Plan Básico
(`src/app/widget/[slug]/page.tsx` y `.../integration/page.tsx`).

Se puede probar el flujo completo en desarrollo, sin desplegar nada:

1. Cuenta de Stripe en **modo de prueba** (gratis, sin verificación).
   Si ya usas Stripe para otro proyecto, crea una cuenta nueva
   dedicada a MODULA (selector de cuenta, arriba a la izquierda del
   Dashboard) para no mezclar datos.
2. Copia `pk_test_...`/`sk_test_...` de Developers → API keys a tu
   `.env.local`.
3. Crea los Productos/Precios (una sola vez por cuenta de Stripe):

   ```bash
   stripe products create --name "MODULA — Plan Básico" --api-key sk_test_...
   stripe prices create --product <id> --unit-amount 49900 --currency mxn -d "recurring[interval]=month" --api-key sk_test_...
   # repetir para "MODULA — Plan Profesional" con el monto que corresponda
   ```

   Guarda los `price_...` resultantes en `STRIPE_PRICE_ID_BASICO` /
   `STRIPE_PRICE_ID_PROFESIONAL`.

4. Instala el [Stripe CLI](https://stripe.com/docs/stripe-cli) y corre,
   en una terminal aparte mientras `npm run dev` está activo:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook --api-key sk_test_...
   ```

   Imprime un `whsec_...` — pégalo en `STRIPE_WEBHOOK_SECRET` y
   reinicia `npm run dev` para que lo tome.

5. En el dashboard, Facturación → "Subir a Profesional" te lleva a
   Stripe Checkout real (modo prueba). Usa la tarjeta de prueba
   `4242 4242 4242 4242`, cualquier fecha futura y CVC — el pago se
   simula sin mover dinero real. Al confirmar, el webhook actualiza el
   plan en segundos y desbloquea Integración automáticamente.

Verificado end-to-end: checkout → webhook → plan actualizado → widget
desbloqueado, y cancelación de suscripción → webhook →
`billingStatus: CANCELADO` + plan degradado a Básico.

## 7. Estado del proyecto

Las Fases 0 a 3 de la especificación están implementadas y verificadas
(dashboard completo, configurador público, widget embebible Plan B,
analítica, miembros, facturación real con Stripe, CSV, webhooks). Ver el backlog
en GitHub para el detalle fase por fase.

Antes de desplegar a producción con tráfico real, conviene resolver los
issues de endurecimiento del backend: rate limiting (ya implementado),
monitoreo de errores (logging estructurado implementado; falta conectar
un servicio real como Sentry si se quiere alertas activas), y la
estrategia de conexión a Postgres para serverless (ver sección 2).
