import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-xl font-semibold">Iniciar sesión</h1>
      <form action={login} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Correo
          <input
            name="email"
            type="email"
            required
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Contraseña
          <input
            name="password"
            type="password"
            required
            className="rounded border px-3 py-2"
          />
        </label>
        <button type="submit" className="rounded bg-black px-3 py-2 text-white">
          Entrar
        </button>
      </form>
    </main>
  );
}
