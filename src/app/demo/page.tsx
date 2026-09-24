import Link from "next/link";
import { headers } from "next/headers";
import { Resend } from "resend";
import { Starfield } from "@/components/ui/starfield-1";
import { Typewriter } from "@/components/ui/typewriter";
import { checkRateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { captureException } from "@/lib/errorReporting";
import { escapeHtml, renderEmailHtml } from "@/lib/emailTemplate";

export const dynamic = "force-dynamic";

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;

  async function requestDemo(formData: FormData) {
    "use server";
    const { redirect } = await import("next/navigation");

    const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rate = checkRateLimit(`demo:${ip}`, 5, 10 * 60_000);
    if (!rate.allowed) redirect("/demo?error=1");

    const website = formData.get("website");
    if (website) {
      // Honeypot: si viene con contenido, es un bot — respondemos éxito
      // sin enviar nada, igual que en el configurador público.
      redirect("/demo?ok=1");
    }

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const company = String(formData.get("company") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    if (!name || !email) redirect("/demo?error=1");

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.NOTIFICATIONS_FROM_EMAIL ?? "notificaciones@modula.app",
          to: process.env.DEMO_REQUEST_EMAIL ?? "notificaciones@modula.app",
          replyTo: email,
          subject: `Solicitud de demo: ${company || name}`,
          text: [`Nombre: ${name}`, `Correo: ${email}`, company && `Empresa: ${company}`, message]
            .filter(Boolean)
            .join("\n"),
          html: renderEmailHtml({
            bodyHtml: `
              <p style="margin:0 0 12px;font-size:16px;font-weight:600;">Nueva solicitud de demo</p>
              <p style="margin:0 0 4px;">Nombre: ${escapeHtml(name)}</p>
              <p style="margin:0 0 4px;">Correo: ${escapeHtml(email)}</p>
              ${company ? `<p style="margin:0 0 4px;">Empresa: ${escapeHtml(company)}</p>` : ""}
              ${message ? `<p style="margin:12px 0 0;">${escapeHtml(message)}</p>` : ""}
            `,
          }),
        });
      } catch (err) {
        captureException(err, { where: "requestDemo" });
        redirect("/demo?error=1");
      }
    } else {
      logger.warn("requestDemo: RESEND_API_KEY no configurado, se omite el envío", { email });
    }

    redirect("/demo?ok=1");
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/LOGO-BLANCO.svg" alt="MODULA" className="h-4 w-auto" />
          </Link>

          {ok ? (
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Listo, ya la recibimos</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Te contactaremos pronto para agendar tu demo.
              </p>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Agenda una demo</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cuéntanos de tu desarrolladora y te contactamos para mostrarte MODULA en vivo.
                </p>
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos.
                </p>
              )}
              <form action={requestDemo} className="flex flex-col gap-5">
                <label className="hidden" aria-hidden="true">
                  No llenar este campo
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Nombre
                  <input
                    name="name"
                    required
                    placeholder="Tu nombre"
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
                <label className="flex flex-col gap-1 text-sm">
                  Empresa
                  <input
                    name="company"
                    placeholder="Tu desarrolladora"
                    className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  Mensaje (opcional)
                  <textarea
                    name="message"
                    rows={3}
                    className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
                  />
                </label>
                <button
                  type="submit"
                  className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Solicitar demo
                </button>
              </form>
            </>
          )}

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
            “<Typewriter text="Cotización en tiempo real, sin depender de un asesor disponible." speed={35} />”
          </p>
          <span className="mt-4 text-sm text-muted-foreground">MODULA</span>
        </div>
      </div>
    </main>
  );
}
