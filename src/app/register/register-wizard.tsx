"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailWarning, UserRoundX, KeyRound, Building2, CircleAlert, Clock } from "lucide-react";
import { PasswordField } from "@/app/login/password-field";
import { createAccount, type CreateAccountError } from "@/lib/actions/register";
import { SubscribeFlow } from "@/components/billing/subscribe-flow";

const registerErrors: Record<CreateAccountError, { icon: typeof CircleAlert; title: string; description: string }> = {
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
  email_taken: {
    icon: MailWarning,
    title: "Ese correo ya tiene una cuenta",
    description: "Inicia sesión en vez de crear una cuenta nueva.",
  },
  rate_limited: {
    icon: Clock,
    title: "Demasiados intentos",
    description: "Espera unos minutos antes de volver a intentarlo.",
  },
};

function ErrorBanner({ code }: { code: CreateAccountError }) {
  const info = registerErrors[code];
  const Icon = info.icon;
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <div>
        <p className="text-sm font-medium text-destructive">{info.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{info.description}</p>
        {code === "email_taken" && (
          <Link href="/login" className="mt-1 inline-block text-sm text-destructive underline underline-offset-4">
            Ir a iniciar sesión
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Registro en dos pasos, sin salir de esta pantalla (README.md issue
 * "Registro en dos pasos"): paso 1 crea la cuenta (datos + contraseña);
 * paso 2 elige el plan y paga con la ventana de tarjeta embebida
 * (src/components/billing/subscribe-flow.tsx) — nunca se redirige a
 * Facturación ni a una página hospedada por Stripe.
 */
export function RegisterWizard({ defaultPlan }: { defaultPlan: "BASICO" | "PROFESIONAL" }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<CreateAccountError | null>(null);
  const [plan, setPlan] = useState<"BASICO" | "PROFESIONAL">(defaultPlan);

  async function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await createAccount(new FormData(e.currentTarget));
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setStep(2);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Paso {step} de 2</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {step === 1 ? "Crea tu cuenta" : "Elige tu plan y paga"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === 1
            ? "Primero tus datos. El plan se elige en el siguiente paso."
            : "Después de pagar, tu cuenta queda lista para usarse de inmediato."}
        </p>
      </div>

      {step === 1 && (
        <>
          {error && <ErrorBanner code={error} />}
          <form onSubmit={handleStep1} className="flex flex-col gap-5">
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
              disabled={submitting}
              className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Creando cuenta…" : "Continuar"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Inicia sesión
            </Link>
          </p>
        </>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPlan("BASICO")}
              className={`rounded-full border px-3 py-1.5 ${
                plan === "BASICO"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Básico · $499/mes
            </button>
            <button
              type="button"
              onClick={() => setPlan("PROFESIONAL")}
              className={`rounded-full border px-3 py-1.5 ${
                plan === "PROFESIONAL"
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Profesional · $999/mes
            </button>
          </div>

          <SubscribeFlow
            plan={plan}
            submitLabel="Pagar y continuar"
            onSuccess={() => router.push("/checkout/success")}
          />
        </div>
      )}
    </div>
  );
}
