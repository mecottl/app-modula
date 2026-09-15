import Link from "next/link";
import { Starfield } from "@/components/ui/starfield-1";
import { Typewriter } from "@/components/ui/typewriter";
import { PasswordField } from "@/app/login/password-field";
import { resetPassword } from "@/lib/actions/passwordReset";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/LOGO-BLANCO.svg" alt="MODULA" className="h-4 w-auto" />
          </Link>

          {!token ? (
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Enlace incompleto</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Abre este enlace desde el correo que te mandamos, o pide uno nuevo.
              </p>
              <Link
                href="/forgot-password"
                className="mt-4 inline-block rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Pedir enlace nuevo
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Elige una contraseña nueva</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Esto cierra cualquier otra sesión que tengas abierta, por seguridad.
                </p>
              </div>
              {error && (
                <p role="alert" aria-live="polite" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <form action={resetPassword} className="flex flex-col gap-5">
                <input type="hidden" name="token" value={token} />
                <PasswordField name="newPassword" label="Contraseña nueva" autoComplete="new-password" minLength={8} />
                <PasswordField
                  name="confirmPassword"
                  label="Confirmar contraseña nueva"
                  autoComplete="new-password"
                  minLength={8}
                />
                <button
                  type="submit"
                  className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Guardar contraseña
                </button>
              </form>
            </>
          )}
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
