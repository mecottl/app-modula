import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class PricingError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "MODEL_NOT_FOUND"
      | "FINISH_LEVEL_NOT_FOUND"
      | "EXTRA_NOT_APPLICABLE",
  ) {
    super(message);
    this.name = "PricingError";
  }
}

export interface PriceBreakdown {
  basePrice: string;
  finishLevelDelta: string;
  extrasDelta: string;
  promotionsDiscount: string;
  total: string;
  appliedPromotions: { id: string; name: string; discount: string }[];
}

/**
 * Calcula el precio total de una configuración (modelo + acabado + extras)
 * aplicando automáticamente las promociones vigentes del desarrollo.
 *
 * Siempre acota la consulta por `developmentId` (aislamiento multi-tenant,
 * ver README.md sección 9.1): un modelo/acabado/extra de otro desarrollo
 * nunca puede colarse en el cálculo.
 */
export async function calculateQuotePrice(params: {
  developmentId: string;
  modelId: string;
  finishLevelId?: string | null;
  extraIds?: string[];
  at?: Date;
}): Promise<PriceBreakdown> {
  const { developmentId, modelId, finishLevelId, extraIds = [], at = new Date() } = params;

  const model = await prisma.model.findFirst({
    where: { id: modelId, developmentId, active: true },
  });
  if (!model) {
    throw new PricingError("Modelo no encontrado en este desarrollo", "MODEL_NOT_FOUND");
  }

  let finishLevel = null;
  if (finishLevelId) {
    finishLevel = await prisma.finishLevel.findFirst({
      where: { id: finishLevelId, developmentId },
    });
    if (!finishLevel) {
      throw new PricingError(
        "Nivel de acabado no encontrado en este desarrollo",
        "FINISH_LEVEL_NOT_FOUND",
      );
    }
  }

  const uniqueExtraIds = [...new Set(extraIds)];
  const extras = uniqueExtraIds.length
    ? await prisma.extra.findMany({
        where: {
          id: { in: uniqueExtraIds },
          developmentId,
          modelLinks: { some: { modelId } },
        },
      })
    : [];
  if (extras.length !== uniqueExtraIds.length) {
    throw new PricingError(
      "Uno o más extras no existen o no aplican a este modelo",
      "EXTRA_NOT_APPLICABLE",
    );
  }

  const basePrice = model.basePrice;
  const finishLevelDelta = finishLevel?.priceDelta ?? new Prisma.Decimal(0);
  const extrasDelta = extras.reduce(
    (sum, extra) => sum.add(extra.priceDelta),
    new Prisma.Decimal(0),
  );

  const subtotal = basePrice.add(finishLevelDelta).add(extrasDelta);

  const activePromotions = await prisma.promotion.findMany({
    where: {
      developmentId,
      active: true,
      startDate: { lte: at },
      endDate: { gte: at },
    },
  });

  let promotionsDiscount = new Prisma.Decimal(0);
  const appliedPromotions: PriceBreakdown["appliedPromotions"] = [];
  for (const promo of activePromotions) {
    const discount =
      promo.type === "PORCENTAJE"
        ? subtotal.mul(promo.value).div(100)
        : promo.value;
    promotionsDiscount = promotionsDiscount.add(discount);
    appliedPromotions.push({
      id: promo.id,
      name: promo.name,
      discount: discount.toFixed(2),
    });
  }

  const total = Prisma.Decimal.max(subtotal.sub(promotionsDiscount), new Prisma.Decimal(0));

  return {
    basePrice: basePrice.toFixed(2),
    finishLevelDelta: finishLevelDelta.toFixed(2),
    extrasDelta: extrasDelta.toFixed(2),
    promotionsDiscount: promotionsDiscount.toFixed(2),
    total: total.toFixed(2),
    appliedPromotions,
  };
}
