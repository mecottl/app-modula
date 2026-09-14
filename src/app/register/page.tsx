import Link from "next/link";
import { Starfield } from "@/components/ui/starfield-1";
import { Typewriter } from "@/components/ui/typewriter";
import { RegisterWizard } from "./register-wizard";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const defaultPlan = plan === "PROFESIONAL" ? "PROFESIONAL" : "BASICO";

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/LOGO-BLANCO.svg" alt="MODULA" className="h-4 w-auto" />
          </Link>
          <RegisterWizard defaultPlan={defaultPlan} />
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-muted/40 lg:block">
        <Starfield quantity={300} speed={0.25} opacity={0.15} />
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-12 text-center">
          <p className="max-w-sm text-2xl font-medium leading-snug tracking-tight">
            “<Typewriter text="Configura tu primer desarrollo hoy, sin instalación." speed={35} />”
          </p>
          <span className="mt-4 text-sm text-muted-foreground">MODULA</span>
        </div>
      </div>
    </main>
  );
}
