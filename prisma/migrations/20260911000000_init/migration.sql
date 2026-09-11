-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccountPlan" AS ENUM ('BASICO', 'PROFESIONAL');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('TRIAL', 'ACTIVO', 'MOROSO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ADMINISTRADOR', 'EDITOR_CATALOGO', 'SOLO_LECTURA');

-- CreateEnum
CREATE TYPE "DevelopmentStatus" AS ENUM ('BORRADOR', 'PUBLICADO');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('PORCENTAJE', 'FIJO');

-- CreateEnum
CREATE TYPE "IntegrationMode" AS ENUM ('HOSPEDADA', 'WIDGET');

-- CreateEnum
CREATE TYPE "IntegrationEnv" AS ENUM ('VISTA_PREVIA', 'PRODUCCION');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('NUEVA', 'CONTACTADA', 'CERRADA');

-- CreateEnum
CREATE TYPE "QuoteOrigin" AS ENUM ('A', 'B');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" "AccountPlan" NOT NULL DEFAULT 'BASICO',
    "billingStatus" "BillingStatus" NOT NULL DEFAULT 'TRIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'SOLO_LECTURA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "developments" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "DevelopmentStatus" NOT NULL DEFAULT 'BORRADOR',
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "accentColor" TEXT,
    "ctaText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "developments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "models" (
    "id" TEXT NOT NULL,
    "developmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "areaM2" DECIMAL(10,2) NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "basePrice" DECIMAL(14,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finish_levels" (
    "id" TEXT NOT NULL,
    "developmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceDelta" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finish_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extras" (
    "id" TEXT NOT NULL,
    "developmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceDelta" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extra_model" (
    "extraId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,

    CONSTRAINT "extra_model_pkey" PRIMARY KEY ("extraId","modelId")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "developmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_settings" (
    "id" TEXT NOT NULL,
    "developmentId" TEXT NOT NULL,
    "mode" "IntegrationMode" NOT NULL DEFAULT 'HOSPEDADA',
    "environment" "IntegrationEnv" NOT NULL DEFAULT 'VISTA_PREVIA',
    "token" TEXT NOT NULL,
    "authorizedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "developmentId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "finishLevelId" TEXT,
    "extraIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "total" DECIMAL(14,2) NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'NUEVA',
    "originPlan" "QuoteOrigin" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE INDEX "members_accountId_idx" ON "members"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "developments_slug_key" ON "developments"("slug");

-- CreateIndex
CREATE INDEX "developments_accountId_idx" ON "developments"("accountId");

-- CreateIndex
CREATE INDEX "models_developmentId_idx" ON "models"("developmentId");

-- CreateIndex
CREATE INDEX "finish_levels_developmentId_idx" ON "finish_levels"("developmentId");

-- CreateIndex
CREATE INDEX "extras_developmentId_idx" ON "extras"("developmentId");

-- CreateIndex
CREATE INDEX "promotions_developmentId_idx" ON "promotions"("developmentId");

-- CreateIndex
CREATE INDEX "promotions_developmentId_active_startDate_endDate_idx" ON "promotions"("developmentId", "active", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "integration_settings_developmentId_key" ON "integration_settings"("developmentId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_settings_token_key" ON "integration_settings"("token");

-- CreateIndex
CREATE INDEX "quotes_developmentId_idx" ON "quotes"("developmentId");

-- CreateIndex
CREATE INDEX "quotes_developmentId_status_idx" ON "quotes"("developmentId", "status");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "developments" ADD CONSTRAINT "developments_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "models" ADD CONSTRAINT "models_developmentId_fkey" FOREIGN KEY ("developmentId") REFERENCES "developments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finish_levels" ADD CONSTRAINT "finish_levels_developmentId_fkey" FOREIGN KEY ("developmentId") REFERENCES "developments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extras" ADD CONSTRAINT "extras_developmentId_fkey" FOREIGN KEY ("developmentId") REFERENCES "developments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extra_model" ADD CONSTRAINT "extra_model_extraId_fkey" FOREIGN KEY ("extraId") REFERENCES "extras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extra_model" ADD CONSTRAINT "extra_model_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_developmentId_fkey" FOREIGN KEY ("developmentId") REFERENCES "developments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_settings" ADD CONSTRAINT "integration_settings_developmentId_fkey" FOREIGN KEY ("developmentId") REFERENCES "developments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_developmentId_fkey" FOREIGN KEY ("developmentId") REFERENCES "developments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_finishLevelId_fkey" FOREIGN KEY ("finishLevelId") REFERENCES "finish_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

