import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildCatalogTree, findPath, isVisibleForModel } from "@/lib/catalogTree";

export class PricingError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "MODEL_NOT_FOUND"
      | "OPTION_NOT_FOUND"
      | "OPTION_SINGLE_SELECT"
      | "OPTION_NOT_APPLICABLE"
      | "PROMO_CODE_INVALID",
  ) {
    super(message);
    this.name = "PricingError";
  }
}

export interface PriceBreakdown {
  basePrice: string;
  /** Suma de todas las opciones elegidas del catálogo. */
  optionsDelta: string;
  /** La misma suma desglosada por categoría raíz (solo las que suman algo distinto de 0). */
  sections: { name: string; delta: string }[];
  promotionsDiscount: string;
  total: string;
  appliedPromotions: { id: string; name: string; discount: string }[];
}

/**
 * Calcula el precio total de una configuración (modelo + opciones del
 * árbol de catálogo) aplicando el código de promoción si lo hay.
 *
 * Siempre acota la consulta por `developmentId` (aislamiento multi-tenant,
 * ver README.md sección 9.1): un modelo u opción de otro desarrollo
 * nunca puede colarse en el cálculo.
 *
 * `optionIds` son los ids de opciones elegidas (hojas no raíz del árbol).
 * `finishOptionIds` / `extraIds` se siguen aceptando y se fusionan, para
 * no romper a quien todavía llame a la API con el formato anterior.
 */
export async function calculateQuotePrice(params: {
  developmentId: string;
  modelId: string;
  optionIds?: string[];
  finishOptionIds?: string[];
  extraIds?: string[];
  promoCode?: string | null;
  at?: Date;
}): Promise<PriceBreakdown> {
  const {
    developmentId,
    modelId,
    optionIds = [],
    finishOptionIds = [],
    extraIds = [],
    promoCode,
    at = new Date(),
  } = params;

  const model = await prisma.model.findFirst({
    where: { id: modelId, developmentId, active: true },
  });
  if (!model) {
    throw new PricingError("Modelo no encontrado en este desarrollo", "MODEL_NOT_FOUND");
  }

  const selectedIds = [...new Set([...optionIds, ...finishOptionIds, ...extraIds])];
  let optionsDelta = new Prisma.Decimal(0);
  const sectionDeltas = new Map<string, Prisma.Decimal>();
  if (selectedIds.length) {
    const rows = await prisma.catalogNode.findMany({
      where: { developmentId },
      include: { modelLinks: { select: { modelId: true } } },
    });
    const tree = buildCatalogTree(rows);
    const priceById = new Map(rows.map((r) => [r.id, r.priceDelta]));
    const pickedPerParent = new Map<string, number>();

    for (const id of selectedIds) {
      const path = findPath(tree, id);
      const node = path?.[path.length - 1];
      // Solo se eligen hojas que no son raíz: las categorías y subcategorías son secciones.
      if (!path || !node || path.length < 2 || node.children.length > 0) {
        throw new PricingError("Una o más opciones no existen en este desarrollo", "OPTION_NOT_FOUND");
      }
      if (path.some((n) => !isVisibleForModel(n, modelId))) {
        throw new PricingError("Una o más opciones no aplican a este modelo", "OPTION_NOT_APPLICABLE");
      }
      const parent = path[path.length - 2];
      const picked = (pickedPerParent.get(parent.id) ?? 0) + 1;
      pickedPerParent.set(parent.id, picked);
      if (parent.selectionMode === "UNICA" && picked > 1) {
        throw new PricingError(`"${parent.name}" solo permite elegir una opción`, "OPTION_SINGLE_SELECT");
      }

      const price = priceById.get(id) ?? new Prisma.Decimal(0);
      optionsDelta = optionsDelta.add(price);
      sectionDeltas.set(path[0].name, (sectionDeltas.get(path[0].name) ?? new Prisma.Decimal(0)).add(price));
    }
  }

  const basePrice = model.basePrice;
  const subtotal = basePrice.add(optionsDelta);

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
    optionsDelta: optionsDelta.toFixed(2),
    sections: [...sectionDeltas]
      .filter(([, delta]) => !delta.isZero())
      .map(([name, delta]) => ({ name, delta: delta.toFixed(2) })),
    promotionsDiscount: promotionsDiscount.toFixed(2),
    total: total.toFixed(2),
    appliedPromotions,
  };
}
