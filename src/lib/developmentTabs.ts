export const DEVELOPMENT_TABS = [
  { href: "general", label: "General" },
  { href: "brand", label: "Marca" },
  { href: "models", label: "Catálogo" },
  { href: "finishes", label: "Acabados y extras" },
  { href: "promotions", label: "Reglas de precio" },
  { href: "quotes", label: "Cotizaciones" },
  { href: "analytics", label: "Analítica" },
  {
    href: "integration",
    label: "Integración",
    children: [
      { href: "integration/snippet", label: "Snippet de instalación" },
      { href: "integration/preview", label: "Vista previa en vivo" },
      { href: "integration/domains", label: "Entorno y dominios autorizados" },
      { href: "integration/token", label: "Token del proyecto" },
      { href: "integration/custom-domain", label: "Dominio personalizado" },
    ],
  },
] as const;
