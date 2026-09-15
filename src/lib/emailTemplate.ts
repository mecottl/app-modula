/**
 * Layout HTML compartido para los correos transaccionales (issue #65)
 * — header con la marca, cuerpo, pie de página. Inline styles porque
 * los clientes de correo no cargan hojas de estilo externas.
 */
export function renderEmailHtml({
  preheader,
  bodyHtml,
  ctaLabel,
  ctaUrl,
}: {
  preheader?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ""}
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f4;padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;max-width:480px;width:100%;">
            <tr>
              <td style="padding:24px 32px;border-bottom:1px solid #e7e5e4;">
                <span style="font-size:18px;font-weight:600;letter-spacing:0.02em;color:#121111;">MODULA</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#292524;font-size:14px;line-height:1.6;">
                ${bodyHtml}
                ${
                  ctaLabel && ctaUrl
                    ? `<table cellpadding="0" cellspacing="0" style="margin-top:24px;">
                        <tr>
                          <td style="border-radius:9999px;background-color:#121111;">
                            <a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;color:#fafaf7;font-size:14px;font-weight:500;text-decoration:none;">${ctaLabel}</a>
                          </td>
                        </tr>
                      </table>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background-color:#fafaf9;color:#a8a29e;font-size:12px;">
                MODULA, configurador de vivienda para desarrolladoras inmobiliarias.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
