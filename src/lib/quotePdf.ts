import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function formatMoney(value: string | number, currency: string) {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(num);
}

/**
 * Genera el PDF de comprobante de una cotización (issue #46). No recalcula
 * el total: usa el ya guardado en la cotización (fijado al momento de
 * cotizar, con cualquier promoción ya aplicada por el motor de precio) para
 * no mostrar un número distinto al que vio el comprador. Los precios de
 * modelo/acabado/extras se muestran solo como referencia informativa y
 * pueden no sumar exactamente el total si el catálogo cambió después.
 */
export async function generateQuotePdf(params: {
  developmentName: string;
  currency: string;
  createdAt: Date;
  quoteId: string;
  modelName: string;
  modelPrice: string;
  finishOptions: { name: string; price: string }[];
  extras: { name: string; price: string }[];
  total: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 56;
  const pageWidth = page.getWidth();
  let y = page.getHeight() - margin;

  function text(
    value: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; gap?: number } = {},
  ) {
    const size = opts.size ?? 11;
    page.drawText(value, {
      x: margin,
      y,
      size,
      font: opts.bold ? bold : font,
      color: opts.color ? rgb(...opts.color) : rgb(0.1, 0.1, 0.1),
    });
    y -= (opts.gap ?? size + 8);
  }

  function rightText(value: string, size = 11, boldFont = false) {
    const f = boldFont ? bold : font;
    const width = f.widthOfTextAtSize(value, size);
    page.drawText(value, { x: pageWidth - margin - width, y: y + size + 8, size, font: f });
  }

  text(params.developmentName, { size: 18, bold: true, gap: 26 });
  text("Comprobante de cotización", { size: 12, color: [0.4, 0.4, 0.4], gap: 22 });

  text(`Folio: ${params.quoteId}`, { size: 9, color: [0.5, 0.5, 0.5], gap: 14 });
  text(
    `Fecha: ${params.createdAt.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}`,
    { size: 9, color: [0.5, 0.5, 0.5], gap: 26 },
  );

  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 24;

  text("Configuración", { size: 13, bold: true, gap: 20 });

  text(params.modelName, { size: 11, gap: 18 });
  rightText(formatMoney(params.modelPrice, params.currency));

  for (const option of params.finishOptions) {
    text(option.name, { size: 11, gap: 18 });
    rightText(`+${formatMoney(option.price, params.currency)}`);
  }

  for (const extra of params.extras) {
    text(extra.name, { size: 11, gap: 18 });
    rightText(`+${formatMoney(extra.price, params.currency)}`);
  }

  y -= 8;
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 24;

  text("Total cotizado", { size: 13, bold: true, gap: 22 });
  rightText(formatMoney(params.total, params.currency), 16, true);
  y -= 8;

  text("Datos de contacto", { size: 13, bold: true, gap: 20 });
  text(params.customerName, { size: 11, gap: 16 });
  text(params.customerEmail, { size: 11, gap: 16 });
  if (params.customerPhone) {
    text(params.customerPhone, { size: 11, gap: 16 });
  }

  page.drawText("Generado con MODULA. Esta cotización no constituye un contrato de compraventa.", {
    x: margin,
    y: margin - 20,
    size: 8,
    font,
    color: rgb(0.6, 0.6, 0.6),
  });

  return doc.save();
}
