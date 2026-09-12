import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { error } = await searchParams;

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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-4">
      <Link href="/" className="text-sm font-semibold tracking-tight">
        MODULA
      </Link>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entra al dashboard de tu cuenta.</p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          Correo o contraseña incorrectos.
        </p>
      )}
      <form action={login} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Correo
          <input
            name="email"
            type="email"
            required
            className="rounded-md border px-3 py-2 outline-none focus:border-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contraseña
          <input
            name="password"
            type="password"
            required
            className="rounded-md border px-3 py-2 outline-none focus:border-foreground"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
