import { notFound } from "next/navigation";
import { requireDevelopmentForSession, TenantAccessError } from "@/lib/tenant";

export default async function DevelopmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await requireDevelopmentForSession(id);
  } catch (error) {
    if (error instanceof TenantAccessError) notFound();
    throw error;
  }

  return <div className="flex flex-col gap-6">{children}</div>;
}
