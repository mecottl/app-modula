import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { Starfield } from "@/components/ui/starfield-1";
import { Typewriter } from "@/components/ui/typewriter";
import { PasswordField } from "./password-field";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const { callbackUrl } = await searchParams;
    const email = formData.get("email");
    const password = formData.get("password");
    try {
      await signIn("credentials", {
        email,
        password,
        redirectTo: callbackUrl ?? "/dashboard",
      });
    } catch (error) {
      if (error && typeof error === "object" && "type" in error) {
        redirect(`/login?error=credenciales`);
      }
      throw error;
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/LOGO-BLANCO.svg" alt="MODULA" className="h-4 w-auto" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Inicia sesión en tu cuenta</h1>
            <p className="mt-2 text-sm text-muted-foreground">Entra al dashboard de tu cuenta.</p>
          </div>
          {ok && (
            <p role="status" aria-live="polite" className="text-sm text-green-600">
              {ok}
            </p>
          )}
          {error && (
            <p role="alert" aria-live="polite" className="text-sm text-destructive">
              Correo o contraseña incorrectos.
            </p>
          )}
          <form action={login} className="flex flex-col gap-5">
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
            <div className="flex flex-col gap-1">
              <PasswordField />
              <Link
                href="/forgot-password"
                className="self-end text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <button
              type="submit"
              className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Entrar
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-foreground underline underline-offset-4">
              Crea una
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
