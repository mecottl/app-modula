-- El proyecto vive en Supabase, que expone toda tabla del esquema "public"
-- vía su API PostgREST (anon/authenticated) a menos que se active RLS.
-- El backend de esta app se conecta directo a Postgres (rol con bypass de
-- RLS) y hace su propio aislamiento multi-tenant en código
-- (ver src/lib/tenant.ts) — esta migración solo evita que las tablas queden
-- accesibles sin querer a través de la API pública de Supabase.
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "developments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "models" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "finish_levels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "extras" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "extra_model" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "promotions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "integration_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "quotes" ENABLE ROW LEVEL SECURITY;
