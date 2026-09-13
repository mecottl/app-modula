import Link from "next/link";
import { MailWarning, UserRoundX, KeyRound, Building2, CreditCard, CircleAlert } from "lucide-react";
import { Starfield } from "@/components/ui/starfield-1";
import { Typewriter } from "@/components/ui/typewriter";
import { PasswordField } from "@/app/login/password-field";
import { registerAccount } from "@/lib/actions/register";

export const dynamic = "force-dynamic";

const planLabels = {
  BASICO: { name: "Plan Básico", price: "$499 MXN/mes" },
  PROFESIONAL: { name: "Plan Profesional", price: "$999 MXN/mes" },
} as const;

const registerErrors: Record<string, { icon: typeof CircleAlert; title: string; description: string }> = {
  invalid_companyName: {
    icon: Building2,
    title: "Falta el nombre de tu desarrolladora",
    description: "Escribe cómo se llama tu empresa (al menos 2 caracteres).",
  },
  invalid_name: {
    icon: UserRoundX,
    title: "Falta tu nombre",
    description: "Escribe tu nombre completo (al menos 2 caracteres).",
  },
  invalid_email: {
    icon: MailWarning,
    title: "Correo inválido",
    description: "Revisa que el correo esté bien escrito.",
  },
  invalid_password: {
    icon: KeyRound,
    title: "Contraseña muy corta",
    description: "Usa al menos 8 caracteres.",
  },
  invalid_plan: {
    icon: CircleAlert,
    title: "Plan inválido",
    description: "Elige Básico o Profesional antes de continuar.",
  },
  email_taken: {
    icon: MailWarning,
    title: "Ese correo ya tiene una cuenta",
    description: "Inicia sesión en vez de crear una cuenta nueva.",
  },
  stripe_unavailable: {
    icon: CreditCard,
    title: "Pagos no disponibles en este momento",
    description: "No se pudo conectar con Stripe. Intenta de nuevo en unos minutos.",
  },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; error?: string }>;
}) {
  const { plan: rawPlan, error } = await searchParams;
  const plan = rawPlan === "PROFESIONAL" ? "PROFESIONAL" : "BASICO";
  const planInfo = planLabels[plan];

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            MODULA
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Crea tu cuenta</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Vas a contratar el <span className="text-foreground">{planInfo.name}</span> (
              {planInfo.price}). Después de crear tu cuenta pagas directo con Stripe.
            </p>
          </div>

          <div className="flex gap-2 text-xs">
            <Link
              href="/register?plan=BASICO"
              className={`rounded-full border px-3 py-1.5 ${
                plan === "BASICO"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Básico · $499/mes
            </Link>
            <Link
              href="/register?plan=PROFESIONAL"
              className={`rounded-full border px-3 py-1.5 ${
                plan === "PROFESIONAL"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Profesional · $999/mes
            </Link>
          </div>

          {error &&
            (() => {
              const info = registerErrors[error];
              const Icon = info?.icon ?? CircleAlert;
              return (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3"
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      {info?.title ?? "No se pudo crear la cuenta"}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {info?.description ?? "Revisa los campos del formulario e intenta de nuevo."}
                    </p>
                    {error === "email_taken" && (
                      <Link
                        href="/login"
                        className="mt-1 inline-block text-sm text-destructive underline underline-offset-4"
                      >
                        Ir a iniciar sesión
                      </Link>
                    )}
                  </div>
                </div>
              );
            })()}

          <form action={registerAccount} className="flex flex-col gap-5">
            <input type="hidden" name="plan" value={plan} />
            <label className="flex flex-col gap-1 text-sm">
              Nombre de tu desarrolladora
              <input
                name="companyName"
                type="text"
                required
                placeholder="Desarrolladora Demo"
                className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Tu nombre
              <input
                name="name"
                type="text"
                required
                className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Correo
              <input
                name="email"
                type="email"
                required
                placeholder="tu@desarrolladora.com"
                className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
              />
            </label>
            <PasswordField />
            <button
              type="submit"
              className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Crear cuenta y pagar {planInfo.price}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Inicia sesión
            </Link>
          </p>
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
