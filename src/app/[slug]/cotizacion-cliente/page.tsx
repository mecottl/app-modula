import { notFound } from "next/navigation";
import { resolvePublicDevelopment } from "@/lib/publicAccess";
import { ConfiguratorPage } from "./ConfiguratorPage";

export const dynamic = "force-dynamic";

export default async function CotizacionClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "1";

  const development = await resolvePublicDevelopment(slug, isPreview);
  if (!development) notFound();

  return <ConfiguratorPage development={development} preview={isPreview} />;
}
