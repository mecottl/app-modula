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
    sections: [
      { id: "snippet", label: "Snippet de instalación" },
      { id: "vista-previa", label: "Vista previa en vivo" },
      { id: "dominios-autorizados", label: "Entorno y dominios autorizados" },
      { id: "token", label: "Token del proyecto" },
      { id: "dominio-personalizado", label: "Dominio personalizado" },
    ],
  },
] as const;
