# Puesta en marcha local — Fase 0

Este documento cubre solo el arranque local del código de la Fase 0
(modelo de datos, motor de precio, autenticación básica y aislamiento
multi-tenant). El detalle funcional completo está en [README.md](README.md).

## 1. Requisitos

- Node.js 20+
- Docker Desktop (para Postgres local)

## 2. Variables de entorno

```bash
cp .env.example .env.local
```

Genera un `AUTH_SECRET` real:

```bash
npx auth secret
```

## 3. Base de datos

```bash
docker compose up -d
npx prisma migrate dev --name init
npm run db:seed
```

El seed crea:
- Cuenta "Desarrolladora Demo" (plan Básico)
- Usuario del dashboard: `admin@demo.com` / `demo1234`
- Desarrollo `los-encinos` (publicado), con un modelo, un nivel de acabado,
  un extra y una promoción de lanzamiento vigente.

## 4. Levantar la app

```bash
npm run dev
```

- Dashboard (protegido, requiere login): http://localhost:3000/dashboard
- Login: http://localhost:3000/login
- Motor de precio (Plan A/B), ejemplo:

```bash
curl -X POST http://localhost:3000/api/developments/los-encinos/pricing \
  -H "Content-Type: application/json" \
  -d '{"modelId":"<id del modelo del seed>","extraIds":[]}'
```

(El script de seed imprime los IDs generados en consola.)

## 5. Qué falta después de la Fase 0

El dashboard y el configurador público visual (módulos de Catálogo,
Acabados y extras, Reglas de precio, Cotizaciones, página pública) son
Fase 1 — ver los issues correspondientes en el repositorio de GitHub.
