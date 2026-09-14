import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class PricingError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "MODEL_NOT_FOUND"
      | "FINISH_OPTION_NOT_FOUND"
      | "FINISH_CATEGORY_SINGLE_SELECT"
      | "EXTRA_NOT_APPLICABLE"
      | "PROMO_CODE_INVALID",
  ) {
    super(message);
    this.name = "PricingError";
  }
}

export interface PriceBreakdown {
  basePrice: string;
  finishesDelta: string;
  extrasDelta: string;
  promotionsDiscount: string;
  total: string;
  appliedPromotions: { id: string; name: string; discount: string }[];
}

/**
 * Calcula el precio total de una configuración (modelo + acabados por
 * categoría + extras) aplicando automáticamente las promociones vigentes
 * del desarrollo.
 *
 * Siempre acota la consulta por `developmentId` (aislamiento multi-tenant,
 * ver README.md sección 9.1): un modelo/acabado/extra de otro desarrollo
 * nunca puede colarse en el cálculo.
 */
export async function calculateQuotePrice(params: {
  developmentId: string;
  modelId: string;
  finishOptionIds?: string[];
  extraIds?: string[];
  promoCode?: string | null;
  at?: Date;
}): Promise<PriceBreakdown> {
  const { developmentId, modelId, finishOptionIds = [], extraIds = [], promoCode, at = new Date() } = params;

  const model = await prisma.model.findFirst({
    where: { id: modelId, developmentId, active: true },
  });
  if (!model) {
    throw new PricingError("Modelo no encontrado en este desarrollo", "MODEL_NOT_FOUND");
  }

  const uniqueFinishOptionIds = [...new Set(finishOptionIds)];
  const finishOptions = uniqueFinishOptionIds.length
    ? await prisma.finishLevel.findMany({
        where: { id: { in: uniqueFinishOptionIds }, developmentId },
        include: { category: true },
      })
    : [];
  if (finishOptions.length !== uniqueFinishOptionIds.length) {
    throw new PricingError(
      "Una o más opciones de acabado no existen en este desarrollo",
      "FINISH_OPTION_NOT_FOUND",
    );
  }
  const optionsByCategory = new Map<string, typeof finishOptions>();
  for (const option of finishOptions) {
    const list = optionsByCategory.get(option.finishCategoryId) ?? [];
    list.push(option);
    optionsByCategory.set(option.finishCategoryId, list);
  }
  for (const options of optionsByCategory.values()) {
    if (options[0].category.selectionMode === "UNICA" && options.length > 1) {
      throw new PricingError(
        `"${options[0].category.name}" solo permite elegir una opción`,
        "FINISH_CATEGORY_SINGLE_SELECT",
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
  const finishesDelta = finishOptions.reduce(
    (sum, option) => sum.add(option.priceDelta),
    new Prisma.Decimal(0),
  );
  const extrasDelta = extras.reduce(
    (sum, extra) => sum.add(extra.priceDelta),
    new Prisma.Decimal(0),
  );

  const subtotal = basePrice.add(finishesDelta).add(extrasDelta);

  // Las promociones ya NO se aplican solas por estar vigentes en fecha
  // (issue "promociones con código, no automáticas"): el comprador debe
  // teclear el código exacto. Un código inválido/vencido/inactivo se
  // reporta como error explícito en vez de ignorarse en silencio, para
  // que el configurador pueda avisarle en vez de solo no aplicar nada.
  let promotionsDiscount = new Prisma.Decimal(0);
  const appliedPromotions: PriceBreakdown["appliedPromotions"] = [];
  if (promoCode) {
    const promo = await prisma.promotion.findFirst({
      where: {
        developmentId,
        code: promoCode.trim().toUpperCase(),
        active: true,
        startDate: { lte: at },
        endDate: { gte: at },
      },
    });
    if (!promo) {
      throw new PricingError("El código de promoción no es válido o ya venció", "PROMO_CODE_INVALID");
    }
    const discount = promo.type === "PORCENTAJE" ? subtotal.mul(promo.value).div(100) : promo.value;
    promotionsDiscount = promotionsDiscount.add(discount);
    appliedPromotions.push({ id: promo.id, name: promo.name, discount: discount.toFixed(2) });
  }

  const total = Prisma.Decimal.max(subtotal.sub(promotionsDiscount), new Prisma.Decimal(0));

  return {
    basePrice: basePrice.toFixed(2),
    finishesDelta: finishesDelta.toFixed(2),
    extrasDelta: extrasDelta.toFixed(2),
    promotionsDiscount: promotionsDiscount.toFixed(2),
    total: total.toFixed(2),
    appliedPromotions,
  };
}
