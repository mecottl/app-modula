-- Roles personalizados por cuenta (issue #72), reemplaza el enum fijo
-- MemberRole. Semilla: 3 roles por cuenta existente, migrando el valor
-- actual de members.role a un roleId real — mismos permisos efectivos
-- que el comportamiento previo (Administrador = todo; Editor de
-- catálogo = catálogo + cotizaciones; Solo lectura = nada), pero ahora
-- editables/creables libremente desde el dashboard.
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "roles_accountId_idx" ON "roles"("accountId");

ALTER TABLE "roles" ADD CONSTRAINT "roles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "roles" ("id", "accountId", "name", "permissions", "createdAt", "updatedAt")
SELECT
  'role_admin_' || "id",
  "id",
  'Administrador',
  ARRAY['catalog.write','quotes.manage','integration.manage','members.manage','billing.manage','development.delete'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "accounts";

INSERT INTO "roles" ("id", "accountId", "name", "permissions", "createdAt", "updatedAt")
SELECT
  'role_editor_' || "id",
  "id",
  'Editor de catálogo',
  ARRAY['catalog.write','quotes.manage'],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "accounts";

INSERT INTO "roles" ("id", "accountId", "name", "permissions", "createdAt", "updatedAt")
SELECT
  'role_readonly_' || "id",
  "id",
  'Solo lectura',
  ARRAY[]::TEXT[],
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "accounts";

ALTER TABLE "members" ADD COLUMN "roleId" TEXT;

UPDATE "members" m
SET "roleId" = CASE m."role"
  WHEN 'ADMINISTRADOR' THEN 'role_admin_' || m."accountId"
  WHEN 'EDITOR_CATALOGO' THEN 'role_editor_' || m."accountId"
  ELSE 'role_readonly_' || m."accountId"
END;

ALTER TABLE "members" ALTER COLUMN "roleId" SET NOT NULL;
ALTER TABLE "members" DROP COLUMN "role";
DROP TYPE "MemberRole";

CREATE INDEX "members_roleId_idx" ON "members"("roleId");
ALTER TABLE "members" ADD CONSTRAINT "members_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
