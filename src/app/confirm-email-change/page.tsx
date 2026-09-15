import Link from "next/link";
import { confirmEmailChange } from "@/lib/actions/account";

export const dynamic = "force-dynamic";

export default async function ConfirmEmailChangePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="mx-auto flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/LOGO-BLANCO.svg" alt="MODULA" className="h-4 w-auto" />
        </Link>

        {!token ? (
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Enlace incompleto</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Abre este enlace desde el correo que te mandamos.
            </p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Confirmar correo nuevo</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Al confirmar, este correo pasa a ser el de acceso a tu cuenta de MODULA.
              </p>
            </div>
            {error && (
              <p role="alert" aria-live="polite" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <form action={confirmEmailChange}>
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                className="w-full rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Confirmar correo
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
