import { notFound } from "next/navigation";
import { requireDevelopmentForSession, TenantAccessError } from "@/lib/tenant";
import { DevelopmentNavAnnouncer } from "@/components/dashboard/development-nav-announcer";

const tabs = [
  { href: "general", label: "General" },
  { href: "brand", label: "Marca" },
  { href: "models", label: "Catálogo" },
  { href: "finishes", label: "Acabados y extras" },
  { href: "promotions", label: "Reglas de precio" },
  { href: "quotes", label: "Cotizaciones" },
  { href: "analytics", label: "Analítica" },
  { href: "integration", label: "Integración" },
];

export default async function DevelopmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let development;
  try {
    development = await requireDevelopmentForSession(id);
  } catch (error) {
    if (error instanceof TenantAccessError) notFound();
    throw error;
  }

  return (
    <div className="flex flex-col gap-6">
      <DevelopmentNavAnnouncer id={development.id} name={development.name} tabs={tabs} />
      {children}
    </div>
  );
}
