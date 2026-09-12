-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('VISITA', 'CONFIGURACION_COMPLETADA', 'COTIZACION_ENVIADA');

-- AlterTable
ALTER TABLE "developments" ADD COLUMN     "webhookUrl" TEXT;

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "developmentId" TEXT NOT NULL,
    "type" "AnalyticsEventType" NOT NULL,
    "originPlan" "QuoteOrigin" NOT NULL,
    "modelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_developmentId_type_idx" ON "analytics_events"("developmentId", "type");

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_developmentId_fkey" FOREIGN KEY ("developmentId") REFERENCES "developments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
