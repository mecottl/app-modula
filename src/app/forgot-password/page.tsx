import Link from "next/link";
import { Starfield } from "@/components/ui/starfield-1";
import { Typewriter } from "@/components/ui/typewriter";
import { requestPasswordReset } from "@/lib/actions/passwordReset";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;

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
              <h1 className="text-2xl font-semibold tracking-tight">Revisa tu correo</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Si ese correo tiene una cuenta en MODULA, te enviamos un enlace para elegir una
                contraseña nueva. Vence en 1 hora.
              </p>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Recupera tu contraseña</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Escribe tu correo y te mandamos un enlace para elegir una contraseña nueva.
                </p>
              </div>
              {error && (
                <p role="alert" aria-live="polite" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <form action={requestPasswordReset} className="flex flex-col gap-5">
                <label className="flex flex-col gap-1 text-sm">
                  Correo
                  <input
                    name="email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    placeholder="tu@desarrolladora.com"
                    className="rounded-md border border-border bg-transparent px-3 py-2 outline-none focus:border-foreground"
                  />
                </label>
                <button
                  type="submit"
                  className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Enviar enlace
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Volver a iniciar sesión
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
