import Link from "next/link";
import { signOut } from "@/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="font-semibold">
            MODULA
          </Link>
          <nav className="flex gap-3 text-sm text-gray-600">
            <Link href="/dashboard/developments" className="hover:underline">
              Desarrollos
            </Link>
            <Link href="/dashboard/members" className="hover:underline">
              Miembros
            </Link>
            <Link href="/dashboard/billing" className="hover:underline">
              Facturación
            </Link>
          </nav>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="text-sm underline">
            Cerrar sesión
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
