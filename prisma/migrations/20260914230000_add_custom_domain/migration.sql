-- Dominios personalizados para el configurador (issue #29): permite
-- que un desarrollo en Plan Profesional sirva su configurador público
-- bajo un dominio propio en vez del dominio de MODULA. customDomainToken
-- es el valor que debe publicarse como registro TXT
-- (_modula-verify.<dominio>) para probar que el dominio es suyo antes
-- de que customDomainVerifiedAt se marque.

-- AlterTable
ALTER TABLE "developments" ADD COLUMN "customDomain" TEXT;
ALTER TABLE "developments" ADD COLUMN "customDomainToken" TEXT;
ALTER TABLE "developments" ADD COLUMN "customDomainVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "developments_customDomain_key" ON "developments"("customDomain");
